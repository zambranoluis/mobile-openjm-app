import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { api } from "../../platform/runtime";
import type { SseEvent } from "../../api/sse";
import { activeResponse } from "./replayState";

type Replay = {
  streamId: string | null;
  submissionId: string | null;
  cursor: string | null;
  text: string;
  interrupted: boolean;
};
/** One consumer connection; reconnects are GETs and never submit a draft again. */
export function useResponseConnection(
  id: string,
  reload: () => Promise<void>,
  onCompleted: (submission: string | null) => void,
) {
  const [busy, setBusy] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const connection = useRef<AbortController | null>(null);
  const pending = useRef<Promise<boolean> | null>(null);
  const mounted = useRef(true);
  const replay = useRef<Replay>({
    streamId: null,
    submissionId: null,
    cursor: null,
    text: "",
    interrupted: false,
  });
  const event = useCallback((value: SseEvent) => {
    if (value.data.trim() !== "[DONE]") {
      const data = JSON.parse(value.data);
      if (value.event === "error")
        throw new Error(data.message ?? "The response could not be completed.");
      const delta = data.choices?.[0]?.delta?.content;
      if (typeof delta === "string") {
        if (replay.current.text.length + delta.length > 2 * 1024 * 1024)
          throw new Error(
            "The response exceeded the device text limit. Reload its saved conversation.",
          );
        replay.current.text += delta;
        if (mounted.current) setPartial(replay.current.text);
      }
    }
    if (value.id) replay.current.cursor = value.id;
  }, []);
  const run = useCallback(
    (operation: (abort: AbortController) => Promise<unknown>) => {
      if (pending.current) return pending.current;
      const abort = new AbortController();
      connection.current = abort;
      if (mounted.current) {
        setBusy(true);
        setError(null);
      }
      const work = (async () => {
        try {
          await operation(abort);
          if (abort.signal.aborted) return false;
          replay.current.interrupted = false;
          await reload();
          if (mounted.current) onCompleted(replay.current.submissionId);
          replay.current.text = "";
          if (mounted.current) setPartial("");
          return true;
        } catch (failure) {
          replay.current.interrupted = true;
          if (mounted.current)
            setError(
              abort.signal.aborted
                ? "Response connection closed. Reconnect to check its state."
                : failure instanceof Error
                  ? failure.message
                  : "Could not connect to the response.",
            );
          return false;
        } finally {
          if (connection.current === abort) {
            connection.current = null;
            pending.current = null;
            if (mounted.current) setBusy(false);
          }
        }
      })();
      pending.current = work;
      return work;
    },
    [reload, onCompleted],
  );
  const reconnect = useCallback(async () => {
    if (id === "new" || !mounted.current) return;
    if (connection.current && !connection.current.signal.aborted) return;
    if (pending.current) await pending.current;
    if (!mounted.current || AppState.currentState !== "active") return;
    try {
      const active = activeResponse(
        await api.request(
          `/v1/conversations/${encodeURIComponent(id)}/streams/active`,
        ),
        id,
      );
      if (
        !mounted.current ||
        AppState.currentState !== "active" ||
        (connection.current && !connection.current.signal.aborted)
      )
        return;
      const known = replay.current;
      const stream =
        active?.streamId ?? (known.interrupted ? known.streamId : null);
      if (!stream) {
        await reload();
        return;
      }
      if (known.streamId !== stream) {
        replay.current = {
          streamId: stream,
          submissionId:
            known.submissionId === active?.clientSubmissionId
              ? known.submissionId
              : null,
          cursor: null,
          text: "",
          interrupted: false,
        };
        setPartial("");
      }
      await run((abort) =>
        api.resume(
          `/v1/conversations/${encodeURIComponent(id)}/streams/${encodeURIComponent(stream)}`,
          event,
          abort.signal,
          replay.current.cursor,
        ),
      );
    } catch (failure) {
      if (mounted.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not recover the response.",
        );
    }
  }, [id, event, reload, run]);
  const send = useCallback(
    async (
      input: { client_submission_id: string } & Record<string, unknown>,
    ) => {
      if (pending.current) return false;
      replay.current = {
        streamId: null,
        submissionId: input.client_submission_id,
        cursor: null,
        text: "",
        interrupted: false,
      };
      setPartial("");
      return run((abort) =>
        api.stream(
          `/v1/conversations/${encodeURIComponent(id)}/messages`,
          input,
          event,
          abort.signal,
          (streamId) => {
            replay.current.streamId = streamId;
          },
        ),
      );
    },
    [id, event, run],
  );
  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      void reconnect();
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void reconnect();
        else connection.current?.abort();
      });
      return () => {
        mounted.current = false;
        connection.current?.abort();
        listener.remove();
      };
    }, [reconnect]),
  );
  const close = useCallback(() => {
    connection.current?.abort();
  }, []);
  return { busy, partial, error, reconnect, send, close };
}
