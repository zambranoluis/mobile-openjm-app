import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { KeyboardScroll } from "../../ui/KeyboardScroll";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { drafts } from "../../platform/drafts";
import { pickAttachment } from "../../platform/attachments";
import type { Attachment } from "../../platform/attachments";
import type {
  Conversation,
  ConversationDetail,
  Message,
  Model,
} from "../../api/types";
import { Button, Copy, Feedback, Field, Row, Screen } from "../../ui/controls";
import { color } from "../../ui/theme";
import { RichText } from "../../ui/RichText";
import { useAuth } from "../auth/AuthProvider";
import { useResponseConnection } from "./useResponseConnection";
import { conversationDetail, prependMessages } from "./conversationData";
import { ConversationActions } from "./ConversationActions";
import { ModelOptions, chatOptions } from "./ModelOptions";
import type { ChatOptions } from "./ModelOptions";

const draftStore = drafts(AsyncStorage);
export function ConversationScreen({ id }: { id: string }) {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState("");
  const [options, setOptions] = useState<ChatOptions>({
    thinking: false,
    webSearch: false,
    complex: false,
  });
  const [chooseModel, setChooseModel] = useState(id === "new");
  const [working, setBusy] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [olderBusy, setOlderBusy] = useState(false);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [turn, setTurn] = useState<{
    status: string;
    jobId: string | null;
  } | null>(null);
  const pageRevision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const focused = useRef(false),
    inspection = useRef<AbortController | null>(null);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        inspection.current?.abort();
      };
    }, []),
  );
  const writes = useRef(Promise.resolve());
  const accountId = profile?.id;
  const submittedDraft = useRef<{ submission: string; content: string } | null>(
    null,
  );
  const load = useCallback(async () => {
    if (id === "new") return;
    const revision = ++pageRevision.current;
    const detail = conversationDetail(
      await api.request<ConversationDetail>(
        `/v1/conversations/${encodeURIComponent(id)}`,
      ),
      id,
    );
    if (mounted.current && revision === pageRevision.current) {
      setMessages(detail.messages);
      setModel(detail.model ?? "");
      setGroupId(detail.group_id ?? null);
      setCursor(detail.has_more ? detail.next_cursor : null);
    }
  }, [id]);
  async function older() {
    if (!cursor || olderBusy || id === "new") return;
    setOlderBusy(true);
    setError(null);
    const revision = pageRevision.current;
    try {
      const detail = conversationDetail(
        await api.request(
          `/v1/conversations/${encodeURIComponent(id)}?${new URLSearchParams({ cursor })}`,
        ),
        id,
      );
      if (mounted.current && revision === pageRevision.current) {
        setMessages((current) => prependMessages(detail.messages, current));
        setCursor(detail.has_more ? detail.next_cursor : null);
      }
    } catch (failure) {
      if (mounted.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not load older messages.",
        );
    } finally {
      if (mounted.current) setOlderBusy(false);
    }
  }
  async function selectModel(value: string) {
    if (working || response.busy) return;
    if (id === "new") {
      setModel(value);
      setChooseModel(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.request(`/v1/conversations/${encodeURIComponent(id)}/model`, {
        method: "PATCH",
        body: JSON.stringify({ model: value }),
      });
      await load();
      setChooseModel(false);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Model change could not be confirmed.",
      );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const completed = useCallback((submission: string | null) => {
    if (submission && submittedDraft.current?.submission === submission) {
      const saved = submittedDraft.current.content;
      setContent((current) => (current === saved ? "" : current));
      setAttachments([]);
      submittedDraft.current = null;
    }
  }, []);
  const response = useResponseConnection(id, load, completed);
  const busy = working || response.busy;
  const partial = response.partial;
  async function inspect(kind: "complexity" | "turn") {
    if (busy) return;
    const abort = new AbortController();
    inspection.current = abort;
    setBusy(true);
    setError(null);
    try {
      const raw = await api.request<Record<string, unknown>>(
        kind === "turn"
          ? `/v1/conversations/${encodeURIComponent(id)}/turn`
          : "/v1/conversations/complexity",
        kind === "turn"
          ? { signal: abort.signal }
          : {
              method: "POST",
              signal: abort.signal,
              body: JSON.stringify({
                content,
                ...chatOptions(
                  models.find((item) => item.id === model),
                  options,
                ),
                model,
              }),
            },
      );
      if (!mounted.current || !focused.current || abort.signal.aborted) return;
      if (kind === "turn") {
        if (
          typeof raw.status !== "string" ||
          ![
            "active",
            "job",
            "completed",
            "failed",
            "cancelled",
            "not_found",
          ].includes(raw.status)
        )
          throw new Error("The response state could not be used.");
        const jobId =
          typeof raw.job_id === "string" &&
          /^[A-Za-z0-9_-]{1,128}$/.test(raw.job_id)
            ? raw.job_id
            : null;
        if (raw.status === "job" && !jobId)
          throw new Error("The response job could not be identified.");
        setTurn({ status: raw.status, jobId });
      } else {
        if (
          typeof raw.decision !== "string" ||
          typeof raw.recommended_mode !== "string" ||
          typeof raw.requires_confirmation !== "boolean"
        )
          throw new Error("The assessment could not be used.");
        setAssessment(
          `${raw.decision} · ${raw.recommended_mode}${raw.requires_confirmation ? " · Choose the task mode before sending." : ""}`,
        );
      }
    } catch (failure) {
      if (mounted.current && focused.current && !abort.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not inspect the response.",
        );
    } finally {
      if (mounted.current) setBusy(false);
      if (inspection.current === abort) inspection.current = null;
    }
  }
  useEffect(() => {
    mounted.current = true;
    let canceled = false;
    void (async () => {
      try {
        const saved = accountId ? await draftStore.read(accountId, id) : null;
        if (!canceled) {
          setContent(saved ?? "");
          setDraftReady(true);
        }
        await load();
      } catch (failure) {
        if (!canceled)
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not load conversation.",
          );
      }
    })();
    void api
      .request<{ data: Model[] }>("/v1/models")
      .then((data) => {
        if (mounted.current)
          setModels(
            data.data.filter(
              (item) =>
                !item.capabilities?.kind || item.capabilities.kind === "chat",
            ),
          );
      })
      .catch(() => {});
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active")
        void load().catch((failure) =>
          setError(
            failure instanceof Error ? failure.message : "Could not reload.",
          ),
        );
      else controller.current?.abort();
    });
    return () => {
      canceled = true;
      mounted.current = false;
      controller.current?.abort();
      listener.remove();
    };
  }, [id, accountId, load]);
  useEffect(() => {
    if (!draftReady || !profile) return;
    const account = profile.id;
    const value = content;
    writes.current = writes.current
      .catch(() => {})
      .then(() => draftStore.write(account, id, value))
      .catch(() => {
        if (mounted.current)
          setError("Your draft could not be saved on this device.");
      });
  }, [content, draftReady, profile, id]);
  async function send() {
    if (busy || uploading || !content.trim() || !draftReady || !model) return;
    setBusy(true);
    setError(null);
    const submitted = content;
    const conversationId = id;
    const abort = new AbortController();
    controller.current = abort;
    let done = false;
    try {
      if (id === "new") {
        const created = await api.request<Conversation>("/v1/conversations", {
          method: "POST",
          body: JSON.stringify({ model }),
        });
        await writes.current;
        await draftStore.write(profile!.id, created.id, submitted);
        await draftStore.write(profile!.id, "new", "");
        // Creation and sending are separate actions, so a navigation/restart cannot submit a draft twice.
        router.replace({
          pathname: "/conversation/[id]",
          params: { id: created.id },
        });
        return;
      }
      const input = {
        ...chatOptions(
          models.find((item) => item.id === model),
          options,
        ),
        model,
        content: submitted,
        client_submission_id: Crypto.randomUUID(),
        image_file_ids: attachments
          .filter((item) => item.kind === "image")
          .map((item) => item.id),
        document_file_ids: attachments
          .filter((item) => item.kind === "document")
          .map((item) => item.id),
      };
      submittedDraft.current = {
        submission: input.client_submission_id,
        content: submitted,
      };
      const mode = await api.request<{ stream: unknown }>(
        "/v1/conversations/request-mode",
        {
          method: "POST",
          signal: abort.signal,
          body: JSON.stringify({
            content: input.content,
            model: input.model,
            ...chatOptions(
              models.find((item) => item.id === model),
              options,
            ),
            image_file_ids: input.image_file_ids,
            document_file_ids: input.document_file_ids,
          }),
        },
      );
      if (typeof mode.stream !== "boolean")
        throw new Error("The response mode could not be confirmed.");
      if (!mode.stream) {
        // Spring's document path queues/persists work through its existing non-streaming contract.
        await api.request(
          `/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ ...input, stream: false }),
            signal: abort.signal,
          },
        );
        done = true;
      } else {
        done = await response.send({ ...input, stream: true });
        if (!done) return;
      }
      if (mounted.current) {
        setContent("");
        setAttachments([]);
        await load();
      }
    } catch (failure) {
      if (mounted.current) {
        setError(
          abort.signal.aborted
            ? "Response connection closed. Reload to check the saved result."
            : failure instanceof Error
              ? failure.message
              : "Could not send.",
        );
        await load().catch(() => {});
      }
    } finally {
      if (mounted.current) setBusy(false);
      controller.current = null;
    }
  }
  async function attach() {
    if (uploading || busy || attachments.length >= 5) return;
    setUploading(true);
    setError(null);
    try {
      const selected = await pickAttachment((abort) => {
        if (mounted.current) controller.current = abort;
        else abort.abort();
      });
      if (selected && mounted.current)
        setAttachments((old) => [...old, selected]);
    } catch (failure) {
      if (mounted.current)
        setError(
          controller.current?.signal.aborted
            ? "Upload interrupted. Select the file again when connected."
            : failure instanceof Error
              ? failure.message
              : "Could not upload file.",
        );
    } finally {
      if (mounted.current) setUploading(false);
      controller.current = null;
    }
  }
  return (
    <Screen scroll={false}>
      <KeyboardScroll
        contentContainerStyle={{ padding: 24, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Button
          label={model ? `Model: ${model}` : "Choose a model"}
          secondary
          disabled={busy}
          onPress={() => setChooseModel((value) => !value)}
        />
        {chooseModel
          ? models.map((item) => (
              <Row
                key={item.id}
                title={item.id}
                detail={item.status}
                onPress={() => void selectModel(item.id)}
              />
            ))
          : null}
        {!models.length && chooseModel ? (
          <Copy muted>
            Available models could not be loaded. Refresh when connected.
          </Copy>
        ) : null}
        <Button
          label="Assess prompt complexity"
          secondary
          disabled={busy || !content.trim()}
          onPress={() => void inspect("complexity")}
        />
        {assessment && <Copy>{assessment}</Copy>}
        {id !== "new" && (
          <>
            <Button
              label="Check saved response state"
              secondary
              disabled={busy}
              onPress={() => void inspect("turn")}
            />
            {turn && <Copy>{turn.status}</Copy>}
            {turn?.jobId && (
              <Button
                label="Open saved response job"
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/job/[id]",
                    params: { id: turn.jobId! },
                  })
                }
              />
            )}
          </>
        )}
        {id !== "new" && (
          <ConversationActions
            id={id}
            groupId={groupId}
            disabled={busy}
            onChanged={load}
          />
        )}
        {cursor && (
          <Button
            label="Load older messages"
            secondary
            busy={olderBusy}
            disabled={busy}
            onPress={() => void older()}
          />
        )}
        {messages.map((message) => (
          <View key={message.id} style={{ gap: 8 }}>
            <Copy muted>{message.role === "user" ? "You" : "OpenJM"}</Copy>
            {message.role === "user" ? (
              <Copy>{message.content}</Copy>
            ) : (
              <RichText>{message.content}</RichText>
            )}
            {message.job_id ? (
              <Row
                title={`Response job · ${message.job_status ?? "View status"}`}
                onPress={() =>
                  router.push({
                    pathname: "/job/[id]",
                    params: { id: message.job_id! },
                  })
                }
              />
            ) : null}
          </View>
        ))}
        {partial ? (
          <View style={{ gap: 8 }}>
            <Copy muted>
              {busy ? "OpenJM · responding" : "OpenJM · partial response"}
            </Copy>
            <RichText>{partial}</RichText>
          </View>
        ) : null}
        {!messages.length && !partial ? (
          <Copy muted>Ask a question or pick up a thought.</Copy>
        ) : null}
        <Feedback message={error ?? response.error} />
        {response.error && id !== "new" ? (
          <Button
            label="Reconnect response"
            secondary
            disabled={busy}
            onPress={() => void response.reconnect()}
          />
        ) : null}
        {attachments.map((item) => (
          <Row
            key={item.id}
            title={item.name}
            detail="Tap to remove from this message"
            onPress={() => {
              if (!busy)
                setAttachments((old) =>
                  old.filter((value) => value.id !== item.id),
                );
            }}
          />
        ))}
        {id !== "new" && (
          <Button
            label="Create or view media"
            secondary
            disabled={busy || uploading}
            onPress={() =>
              router.push({
                pathname: "/conversation/[id]/media",
                params: { id },
              })
            }
          />
        )}
        {id !== "new" && (
          <Button
            label="Open conversation files"
            secondary
            disabled={busy || uploading}
            onPress={() =>
              router.push({
                pathname: "/conversation/[id]/files",
                params: { id },
              })
            }
          />
        )}
        {id !== "new" ? (
          <Button
            label="Attach file"
            secondary
            busy={uploading}
            disabled={busy || attachments.length >= 5}
            onPress={() => void attach()}
          />
        ) : null}
        {uploading ? (
          <Button
            label="Cancel upload"
            secondary
            onPress={() => controller.current?.abort()}
          />
        ) : null}
        <Field
          label="Message"
          multiline
          value={content}
          onChangeText={setContent}
          editable={draftReady && !busy}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <ModelOptions
          model={models.find((item) => item.id === model)}
          value={options}
          onChange={setOptions}
          disabled={busy}
        />
        <Button
          label={id === "new" ? "Create conversation" : "Send message"}
          busy={busy}
          disabled={!model || !content.trim() || !draftReady || uploading}
          onPress={() => void send()}
        />
        {busy ? (
          <Button
            label="Close response connection"
            secondary
            onPress={() => {
              response.close();
              controller.current?.abort();
            }}
          />
        ) : null}
        {error && id !== "new" ? (
          <Button
            label="Reload saved conversation"
            secondary
            onPress={() =>
              void load()
                .then(() => setError(null))
                .catch((failure) => setError(failure.message))
            }
          />
        ) : null}
        <Copy muted>
          Responses need a connection. Your draft stays on this device.
        </Copy>
        <View style={{ height: 8, backgroundColor: color.canvas }} />
      </KeyboardScroll>
    </Screen>
  );
}
