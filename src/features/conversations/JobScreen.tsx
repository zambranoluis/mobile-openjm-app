import { useCallback, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Screen, Title } from "../../ui/controls";
import { RichText } from "../../ui/RichText";
import { useFeatureTask } from "../../ui/useFeatureTask";
import { asRecord } from "../apps/appModel";
import { jobContent, jobState, upstreamJobCursor } from "./jobModel";
export function JobScreen({ id }: { id: string }) {
  const [status, setStatus] = useState<ReturnType<typeof jobState> | null>(
      null,
    ),
    [result, setResult] = useState<string | null>(null),
    [partial, setPartial] = useState(""),
    [tracking, setTracking] = useState(false);
  const { run, busy, error } = useFeatureTask(),
    cursor = useRef<string | null>(null),
    text = useRef(""),
    stream = useRef<AbortController | null>(null);
  const load = useCallback(
    () =>
      run(
        async (signal) => {
          const state = jobState(
            await api.request(`/v1/jobs/${encodeURIComponent(id)}`, { signal }),
            id,
          );
          const content =
            state.status === "completed"
              ? jobContent(
                  await api.request(
                    `/v1/jobs/${encodeURIComponent(id)}/result`,
                    { signal },
                  ),
                  id,
                )
              : null;
          return { state, content };
        },
        (value) => {
          setStatus(value.state);
          setResult(value.content);
          if (value.state.status === "completed") {
            text.current = "";
            setPartial("");
          }
        },
      ).catch(() => {}),
    [id, run],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
        else stream.current?.abort();
      });
      return () => {
        stream.current?.abort();
        listener.remove();
      };
    }, [load]),
  );
  async function follow() {
    await run(async (signal) => {
      const abort = new AbortController();
      stream.current = abort;
      const stop = () => abort.abort();
      signal.addEventListener("abort", stop, { once: true });
      if (!cursor.current) {
        text.current = "";
        setPartial("");
      }
      try {
        await api.resumeJob(
          `/v1/jobs/${encodeURIComponent(id)}/stream`,
          (event) => {
            if (abort.signal.aborted || signal.aborted) return;
            const next = event.id ? upstreamJobCursor(event.id) : null;
            if (event.id && !next)
              throw new Error("The upstream job cursor could not be used.");
            if (
              next &&
              cursor.current &&
              Number(next) <= Number(cursor.current)
            )
              return;
            if (event.data.trim() !== "[DONE]") {
              const raw = asRecord(JSON.parse(event.data));
              if (event.event === "error")
                throw new Error(
                  typeof raw.message === "string"
                    ? raw.message
                    : "The job stream failed.",
                );
              const choices = Array.isArray(raw.choices) ? raw.choices : [],
                delta = asRecord(asRecord(choices[0]).delta);
              if (typeof delta.content === "string") {
                text.current += delta.content;
                if (text.current.length > 2 * 1024 * 1024)
                  throw new Error(
                    "The job response exceeded the device limit.",
                  );
                setPartial(text.current);
              }
            }
            if (next) cursor.current = next;
          },
          abort.signal,
          cursor.current,
        );
      } finally {
        signal.removeEventListener("abort", stop);
        if (stream.current === abort) stream.current = null;
      }
    })
      .then(() => load())
      .catch(() => {});
  }
  async function notify() {
    await run(
      async (signal) => {
        const response = await api.request<{ tracking: unknown }>(
          `/v1/notifications/jobs/${encodeURIComponent(id)}`,
          { method: "POST", signal },
        );
        if (response.tracking !== true)
          throw new Error("Completion alert could not be confirmed.");
      },
      () => setTracking(true),
    ).catch(() => {});
  }
  async function cancel() {
    await run(
      async (signal) =>
        jobState(
          await api.request(`/v1/jobs/${encodeURIComponent(id)}`, {
            method: "DELETE",
            signal,
          }),
          id,
        ),
      setStatus,
    )
      .then(() => load())
      .catch(() => {});
  }
  const terminal =
    status && ["completed", "failed", "cancelled"].includes(status.status);
  return (
    <Screen>
      <Title localize>Response job</Title>
      <Copy muted>{status?.model}</Copy>
      <Copy>{status?.status ?? "Loading status…"}</Copy>
      <Feedback message={error ?? status?.error ?? null} />
      {result ? (
        <RichText>{result}</RichText>
      ) : partial ? (
        <RichText>{partial}</RichText>
      ) : status?.status === "completed" ? (
        <Copy muted>
          The server result has no text. Check its saved conversation for other
          content.
        </Copy>
      ) : null}
      <Button
        label="Refresh status"
        secondary
        disabled={busy}
        onPress={() => void load()}
      />
      {status && !terminal && (
        <>
          <Button
            label="Follow response job"
            secondary
            busy={busy}
            onPress={() => void follow()}
          />
          {busy && (
            <Button
              label="Close job connection"
              secondary
              onPress={() => stream.current?.abort()}
            />
          )}
          <Button
            label={tracking ? "Completion alert enabled" : "Notify me"}
            secondary
            disabled={busy || tracking}
            onPress={() => void notify()}
          />
          <Button
            label="Cancel job"
            secondary
            disabled={busy}
            onPress={() =>
              Alert.alert(
                "Cancel this job?",
                "Cancellation is confirmed by the server.",
                [
                  { text: "Keep running", style: "cancel" },
                  {
                    text: "Cancel job",
                    style: "destructive",
                    onPress: () => void cancel(),
                  },
                ],
              )
            }
          />
        </>
      )}
      <Copy muted>
        Reopening reads server state. Following uses the upstream job cursor and
        never submits a new job.
      </Copy>
    </Screen>
  );
}
