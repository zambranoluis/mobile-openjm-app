import { useCallback, useEffect, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../platform/runtime";
import { shareJson } from "../../platform/exports";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Row,
  Screen,
  Title,
} from "../../ui/controls";
import { useFeatureTask } from "../../ui/useFeatureTask";
import type { Model } from "../../api/types";
import { useAuth } from "../auth/AuthProvider";
import { asRecord, resourceId } from "../apps/appModel";
import { jobState } from "./jobModel";
import { drafts } from "../../platform/drafts";
const draftStore = drafts(AsyncStorage);
export function UtilityScreen({ mode }: { mode: "jobs" | "embeddings" }) {
  const { profile } = useAuth(),
    { run, busy, error } = useFeatureTask();
  const [models, setModels] = useState<Model[]>([]),
    [model, setModel] = useState(""),
    [input, setInput] = useState(""),
    [json, setJson] = useState(false),
    [dimensions, setDimensions] = useState(""),
    [encoding, setEncoding] = useState<"float" | "base64">("float"),
    [priority, setPriority] = useState<"standard" | "realtime">("standard"),
    [attempted, setAttempted] = useState(false),
    [result, setResult] = useState<unknown>(null),
    [created, setCreated] = useState<string | null>(null),
    [recent, setRecent] = useState<string[]>([]),
    [loadedDraft, setLoadedDraft] = useState<string | null>(null),
    [storageError, setStorageError] = useState<string | null>(null);
  const writes = useRef(Promise.resolve());
  const key = `openjm.response-jobs.${profile?.id ?? "unavailable"}`;
  const accountId = profile?.id,
    draftOwner = `${accountId}/${mode}`,
    ready = loadedDraft === draftOwner;
  useEffect(() => {
    let live = true;
    if (accountId)
      void draftStore
        .read(accountId, `tool-${mode}`)
        .then((value) => {
          if (live) {
            setInput(value ?? "");
            setLoadedDraft(draftOwner);
          }
        })
        .catch(() => {
          if (live) {
            setLoadedDraft(draftOwner);
            setStorageError("The local draft could not be read.");
          }
        });
    return () => {
      live = false;
    };
  }, [accountId, mode, draftOwner]);
  function edit(value: string) {
    setInput(value);
    if (!profile) return;
    const account = profile.id;
    writes.current = writes.current
      .catch(() => {})
      .then(() => draftStore.write(account, `tool-${mode}`, value))
      .catch(() => setStorageError("The local draft could not be saved."));
  }
  useFocusEffect(
    useCallback(() => {
      void run(
        async (signal) => {
          const raw = await api.request<{ data: Model[] }>("/v1/models", {
            signal,
          });
          if (!Array.isArray(raw.data))
            throw new Error("Available models could not be loaded.");
          const models = raw.data
            .filter((item) =>
              mode === "embeddings"
                ? item.capabilities?.kind === "embeddings"
                : !item.capabilities?.kind || item.capabilities.kind === "chat",
            )
            .filter(
              (item) =>
                !["disabled", "unavailable", "failed"].includes(
                  item.status ?? "",
                ),
            );
          const saved =
            mode === "jobs"
              ? JSON.parse((await AsyncStorage.getItem(key)) ?? "[]")
              : [];
          if (!Array.isArray(saved) || saved.length > 100)
            throw new Error("Saved response jobs could not be read.");
          return { models, recent: saved.map(resourceId) };
        },
        (value) => {
          setModels(value.models);
          setRecent(value.recent);
        },
      ).catch(() => {});
    }, [key, mode, run]),
  );
  async function create() {
    await run(
      async (signal) => {
        if (
          attempted ||
          !profile ||
          !model ||
          !models.some((item) => item.id === model) ||
          !input.trim()
        )
          throw new Error("Choose an available model and enter input.");
        let body: Record<string, unknown>;
        if (mode === "embeddings") {
          const value = json ? JSON.parse(input) : input;
          const dimension = dimensions ? Number(dimensions) : undefined;
          if (
            dimension !== undefined &&
            (!Number.isSafeInteger(dimension) ||
              dimension < 1 ||
              dimension > 2147483647)
          )
            throw new Error("Dimensions must be a positive integer.");
          body = {
            model,
            input: value,
            encoding_format: encoding,
            ...(dimension ? { dimensions: dimension } : {}),
          };
        } else
          body = {
            model,
            messages: [{ role: "user", content: input }],
            priority,
          };
        if (new TextEncoder().encode(JSON.stringify(body)).length > 1000000)
          throw new Error("The input exceeds the mobile request limit.");
        setAttempted(true);
        const raw = await api.request(
          mode === "jobs" ? "/v1/jobs" : "/v1/embeddings",
          { method: "POST", signal, body: JSON.stringify(body) },
        );
        if (mode === "jobs") {
          const job = jobState(raw),
            ids = [job.id, ...recent.filter((id) => id !== job.id)].slice(
              0,
              100,
            );
          await AsyncStorage.setItem(key, JSON.stringify(ids)).catch(() => {
            setStorageError(
              `Job ${job.id} was created, but its device history could not be saved. Open the confirmed job before leaving.`,
            );
          });
          return { id: job.id, ids, result: null };
        }
        if (!Array.isArray(asRecord(raw).data))
          throw new Error("The embeddings response could not be used.");
        return { id: null, ids: recent, result: raw };
      },
      (value) => {
        setCreated(value.id);
        setRecent(value.ids);
        setResult(value.result);
      },
    ).catch(() => {});
  }
  return (
    <Screen>
      <Title localize>{mode === "jobs" ? "Response jobs" : "Embeddings"}</Title>
      <Copy muted>
        Choose an authoritative model. Generation uses your account’s
        availability and credits; interrupted submissions are never
        automatically retried.
      </Copy>
      <Feedback message={error} />
      <Feedback message={storageError} />
      {models.map((item) => (
        <Row
          key={item.id}
          title={item.id}
          detail={model === item.id ? "Selected" : item.status}
          onPress={() => {
            if (!busy && !attempted) setModel(item.id);
          }}
        />
      ))}
      {!models.length && (
        <Copy muted>No available model for this operation was supplied.</Copy>
      )}
      {mode === "embeddings" && (
        <>
          <Button
            label={json ? "Use text input" : "Use JSON input"}
            secondary
            disabled={busy || attempted}
            onPress={() => setJson((value) => !value)}
          />
          <Button
            label={`Encoding: ${encoding}`}
            secondary
            disabled={busy || attempted}
            onPress={() =>
              setEncoding((value) => (value === "float" ? "base64" : "float"))
            }
          />
          <Field
            label="Dimensions (optional)"
            value={dimensions}
            onChangeText={setDimensions}
            keyboardType="number-pad"
            editable={!busy && !attempted}
          />
        </>
      )}
      {mode === "jobs" && (
        <Button
          label={`Priority: ${priority}`}
          secondary
          disabled={busy || attempted}
          onPress={() =>
            setPriority((value) =>
              value === "standard" ? "realtime" : "standard",
            )
          }
        />
      )}
      <Field
        label={
          mode === "jobs"
            ? "Job prompt"
            : json
              ? "Embedding input as JSON"
              : "Embedding text"
        }
        value={input}
        onChangeText={edit}
        multiline
        maxLength={200000}
        editable={ready && !busy && !attempted}
      />
      <Button
        label={mode === "jobs" ? "Create response job" : "Create embeddings"}
        busy={busy}
        disabled={!ready || attempted || !input.trim() || !model}
        onPress={() => void create()}
      />
      {attempted && (
        <>
          <Copy muted>
            A submission without a confirmed result may still have run. Starting
            another is a separate request.
          </Copy>
          <Button
            label="Start a separate request"
            secondary
            disabled={busy}
            onPress={() => {
              setAttempted(false);
              setResult(null);
              setCreated(null);
            }}
          />
        </>
      )}
      {created && (
        <Button
          label="Open created response job"
          secondary
          onPress={() =>
            router.push({ pathname: "/job/[id]", params: { id: created } })
          }
        />
      )}
      {result !== null && (
        <>
          <Copy>{JSON.stringify(result, null, 2).slice(0, 16000)}</Copy>
          <Copy muted>
            Large results are abbreviated here; export includes the complete
            response.
          </Copy>
          <Button
            label="Save or share embeddings"
            secondary
            disabled={busy}
            onPress={() => void run(() => shareJson(result)).catch(() => {})}
          />
        </>
      )}
      {recent.map((id) => (
        <Row
          key={id}
          title={id}
          detail="Saved response job"
          onPress={() => router.push({ pathname: "/job/[id]", params: { id } })}
        />
      ))}
    </Screen>
  );
}
