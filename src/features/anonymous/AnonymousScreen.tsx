import { useCallback, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import {
  anonymousSession as session,
  clearAnonymousDeviceSession,
  publicResources,
} from "../../platform/anonymous";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { uploadPurpose } from "../files/fileModel";
import { asRecord, asText, resourceId } from "../apps/appModel";
import type { AnonymousResource } from "./anonymousModel";
import { api } from "../../platform/runtime";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";
import { RichText } from "../../ui/RichText";
import { useFeatureTask } from "../../ui/useFeatureTask";
const draftKey = "openjm.anonymous.draft.v1";
export function AnonymousScreen() {
  const [content, setContent] = useState(""),
    [ready, setReady] = useState(false),
    [response, setResponse] = useState("");
  const [attachments, setAttachments] = useState<
    (AnonymousResource & { attachmentKind: "vision" | "analysis" })[]
  >([]);
  const { run, busy, error } = useFeatureTask(),
    controller = useRef<AbortController | null>(null),
    writes = useRef(Promise.resolve());
  useFocusEffect(
    useCallback(() => {
      let live = true;
      void AsyncStorage.getItem(draftKey)
        .then((value) => {
          if (live) {
            setContent(value ?? "");
            setReady(true);
          }
        })
        .catch(() => {
          if (live) setReady(true);
        });
      const listener = AppState.addEventListener("change", (state) => {
        if (state !== "active") controller.current?.abort();
      });
      return () => {
        live = false;
        controller.current?.abort();
        listener.remove();
      };
    }, []),
  );
  function edit(value: string) {
    setContent(value);
    writes.current = writes.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(draftKey, value));
  }
  async function attach() {
    await run(
      async (signal) => {
        if (attachments.length >= 3)
          throw new Error("Attach up to three files.");
        const selection = await DocumentPicker.getDocumentAsync({
          multiple: false,
          copyToCacheDirectory: true,
        });
        if (selection.canceled || signal.aborted) return null;
        const file = new File(selection.assets[0].uri);
        try {
          const purpose = uploadPurpose(selection.assets[0].name, file.size),
            form = new FormData();
          form.append("file", file, selection.assets[0].name);
          form.append("purpose", purpose);
          const id = await session();
          const uploaded = asRecord(
            await api.request(
              "/v1/public/files",
              { method: "POST", signal, body: form },
              false,
            ),
          );
          const entry = await publicResources.save(
            id,
            "file",
            resourceId(uploaded.id),
            selection.assets[0].name,
            uploaded.file_token,
          );
          return {
            ...entry,
            attachmentKind:
              purpose === "vision"
                ? ("vision" as const)
                : ("analysis" as const),
          };
        } finally {
          if (file.exists) file.delete();
        }
      },
      (entry) => {
        if (entry) setAttachments((current) => [...current, entry]);
      },
    ).catch(() => {});
  }
  async function send() {
    await run(
      async (signal) => {
        if (!content.trim() || content.length > 2000)
          throw new Error("Enter a message of up to 2000 characters.");
        const sessionId = await session(),
          abort = new AbortController();
        controller.current = abort;
        const stop = () => abort.abort();
        signal.addEventListener("abort", stop, { once: true });
        let output = "";
        const tokens = await Promise.all(
          attachments.map((entry) => publicResources.token(sessionId, entry)),
        );
        setResponse("");
        try {
          await api.stream(
            "/v1/public/chat/completions",
            {
              message: content,
              stream: true,
              attachments: attachments.map((entry) => ({
                file_id: entry.id,
                kind: entry.attachmentKind,
              })),
              openjm_context: {
                session_id: sessionId,
                locale: Intl.DateTimeFormat().resolvedOptions().locale,
              },
            },
            (event) => {
              if (signal.aborted || abort.signal.aborted) return;
              if (event.data.trim() === "[DONE]") return;
              let raw: Record<string, unknown>;
              try {
                raw = asRecord(JSON.parse(event.data));
              } catch {
                throw new Error(
                  "The anonymous response event could not be used.",
                );
              }
              if (event.event === "error" || raw.status === "error")
                throw new Error(
                  asText(raw.message) ??
                    "The anonymous response could not complete.",
                );
              const choices = Array.isArray(raw.choices) ? raw.choices : [],
                delta = asRecord(asRecord(choices[0]).delta);
              const text =
                asText(delta.content) ??
                (typeof raw.response === "string" ? raw.response : "");
              // Preserve streamed spacing; source text is never translated or interpreted as a URL.
              output +=
                typeof delta.content === "string" ? delta.content : text;
              if (output.length > 2 * 1024 * 1024)
                throw new Error(
                  "The anonymous response exceeded the device limit.",
                );
              setResponse(output);
            },
            abort.signal,
            undefined,
            false,
            tokens.length
              ? { "X-OpenJM-File-Token": tokens.join(",") }
              : undefined,
          );
        } finally {
          signal.removeEventListener("abort", stop);
          if (controller.current === abort) controller.current = null;
        }
      },
      () => {
        edit("");
        setAttachments([]);
      },
    ).catch(() => {});
  }
  async function clear() {
    await run(
      async (signal) => {
        const id = await session();
        await api.request(
          "/v1/public/memory/session",
          {
            method: "DELETE",
            signal,
            headers: { "X-OpenJM-Public-Session-Id": id },
          },
          false,
        );
        await clearAnonymousDeviceSession(id);
      },
      () => {
        setResponse("");
        setAttachments([]);
        edit("");
      },
    ).catch(() => {});
  }
  return (
    <Screen>
      <Title localize>Anonymous chat</Title>
      <Copy muted>
        This online session uses the public service’s availability and daily
        limits. Sign in to keep conversations in your account.
      </Copy>
      {response && <RichText>{response}</RichText>}
      <Feedback message={error} />
      {attachments.map((entry) => (
        <Button
          key={entry.credential}
          secondary
          label={`Remove ${entry.name}`}
          disabled={busy}
          onPress={() =>
            setAttachments((current) =>
              current.filter((item) => item.credential !== entry.credential),
            )
          }
        />
      ))}
      <Button
        label="Attach anonymous file"
        secondary
        disabled={busy || attachments.length >= 3}
        onPress={() => void attach()}
      />
      <Button
        label="Anonymous media and files"
        secondary
        disabled={busy}
        onPress={() => router.push("/anonymous-resources")}
      />
      <Field
        label="Anonymous message"
        multiline
        value={content}
        editable={ready && !busy}
        onChangeText={edit}
      />
      <Button
        label="Send anonymously"
        busy={busy}
        disabled={
          !ready || !content.trim() || content.length > 2000 || !api.configured
        }
        onPress={() => void send()}
      />
      {busy && (
        <Button
          label="Close anonymous response"
          secondary
          onPress={() => controller.current?.abort()}
        />
      )}
      <Button
        label="Clear anonymous session"
        secondary
        disabled={busy}
        onPress={() =>
          Alert.alert(
            "Clear this anonymous session?",
            "Server memory is removed only after confirmation from OpenJM.",
            [
              { text: "Keep session", style: "cancel" },
              {
                text: "Clear session",
                style: "destructive",
                onPress: () => void clear(),
              },
            ],
          )
        }
      />
      <Copy muted>
        Interrupted responses remain partial. Returning never submits a message
        again.
      </Copy>
    </Screen>
  );
}
