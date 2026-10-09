import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { anonymousSession, publicResources } from "../../platform/anonymous";
import { cacheBinary, shareBinary } from "../../platform/exports";
import { MediaPlayer } from "../../platform/MediaPlayer";
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
import { asRecord, resourceId } from "../apps/appModel";
import type { AnonymousResource } from "./anonymousModel";
type Kind = "image" | "music";
const path = (kind: Kind) =>
  kind === "image" ? "/v1/public/images/generations" : "/v1/public/audio/music";
export function AnonymousResourcesScreen() {
  const [kind, setKind] = useState<Kind>("image"),
    [prompt, setPrompt] = useState(""),
    [negative, setNegative] = useState(""),
    [lyrics, setLyrics] = useState(""),
    [duration, setDuration] = useState("30"),
    [size, setSize] = useState(""),
    [steps, setSteps] = useState(""),
    [seed, setSeed] = useState(""),
    [language, setLanguage] = useState("");
  const [entries, setEntries] = useState<AnonymousResource[]>([]),
    [selected, setSelected] = useState<AnonymousResource | null>(null),
    [status, setStatus] = useState<string | null>(null),
    [uri, setUri] = useState<string | null>(null),
    [attempted, setAttempted] = useState(false);
  const { run, busy, error } = useFeatureTask();
  const list = useCallback(
    () =>
      run(
        async () => publicResources.list(await anonymousSession()),
        setEntries,
      ).catch(() => {}),
    [run],
  );
  useFocusEffect(
    useCallback(() => {
      void list();
      return () => setUri(null);
    }, [list]),
  );
  async function generate() {
    await run(
      async (signal) => {
        if (attempted)
          throw new Error("Start a separate request to generate again.");
        if (!prompt.trim() || prompt.length > (kind === "image" ? 1000 : 2000))
          throw new Error(
            "The prompt is outside this public service's limits.",
          );
        const seconds = Number(duration);
        if (
          kind === "image" &&
          size &&
          !/^(?:[2-9]\d{2}|1[0-4]\d{2}|15[0-3]\d)x(?:[2-9]\d{2}|1[0-4]\d{2}|15[0-3]\d)$/.test(
            size,
          )
        )
          throw new Error(
            "Use an image size such as 1024x1024 within the public service limits.",
          );
        if (
          kind === "music" &&
          ((steps &&
            (!Number.isInteger(Number(steps)) ||
              Number(steps) < 1 ||
              Number(steps) > 60)) ||
            (seed && !Number.isSafeInteger(Number(seed))) ||
            language.length > 64)
        )
          throw new Error(
            "Use 1–60 music steps, an integer seed and at most 64 vocal-language characters.",
          );
        if (kind === "image" && negative.length > 1000)
          throw new Error("The negative prompt is too long.");
        if (
          kind === "music" &&
          (!Number.isFinite(seconds) ||
            seconds < 10 ||
            seconds > 600 ||
            lyrics.length > 8000)
        )
          throw new Error(
            "Use 10–600 seconds and at most 8000 lyric characters.",
          );
        const session = await anonymousSession();
        setAttempted(true);
        const raw = asRecord(
          await api.request(
            path(kind),
            {
              method: "POST",
              signal,
              body: JSON.stringify(
                kind === "image"
                  ? {
                      prompt: prompt.trim(),
                      ...(negative ? { negative_prompt: negative } : {}),
                      ...(size ? { size } : {}),
                    }
                  : {
                      model: "openjm-music-1",
                      prompt: prompt.trim(),
                      duration_seconds: seconds,
                      ...(lyrics ? { lyrics } : {}),
                      ...(steps ? { steps: Number(steps) } : {}),
                      ...(seed ? { seed: Number(seed) } : {}),
                      ...(language.trim()
                        ? { vocal_language: language.trim() }
                        : {}),
                    },
              ),
            },
            false,
          ),
        );
        const entry = await publicResources.save(
          session,
          kind,
          resourceId(raw.id),
          prompt,
          raw.job_token,
        );
        return {
          entry,
          entries: await publicResources.list(session),
          status: typeof raw.status === "string" ? raw.status : null,
        };
      },
      (result) => {
        setSelected(result.entry);
        setStatus(result.status);
        setEntries(result.entries);
        setUri(null);
      },
    ).catch(() => {});
  }
  async function select(entry: AnonymousResource) {
    setSelected(entry);
    setStatus(null);
    setUri(null);
    if (entry.kind === "file") return;
    await refresh(entry);
  }
  async function refresh(entry = selected) {
    if (!entry || entry.kind === "file") return;
    await run(async (signal) => {
      const token = await publicResources.token(
        await anonymousSession(),
        entry,
      );
      const raw = asRecord(
        await api.request(
          `${path(entry.kind as Kind)}/${encodeURIComponent(entry.id)}`,
          { signal, headers: { "X-OpenJM-Job-Token": token } },
          false,
        ),
      );
      if (
        resourceId(raw.id) !== entry.id ||
        typeof raw.status !== "string" ||
        ![
          "queued",
          "planning",
          "deferred",
          "generating",
          "completed",
          "failed",
        ].includes(raw.status)
      )
        throw new Error("The public job state could not be used.");
      return raw.status;
    }, setStatus).catch(() => {});
  }
  async function download(share = false) {
    if (!selected || (selected.kind !== "file" && status !== "completed"))
      return;
    await run(
      async (signal) => {
        const entry = selected,
          token = await publicResources.token(await anonymousSession(), entry);
        const contentPath =
          entry.kind === "file"
            ? `/v1/public/files/${encodeURIComponent(entry.id)}/content`
            : `${path(entry.kind)}/${encodeURIComponent(entry.id)}/content`;
        const payload = await api.binary(
          contentPath,
          {
            signal,
            headers: {
              [entry.kind === "file"
                ? "X-OpenJM-File-Token"
                : "X-OpenJM-Job-Token"]: token,
            },
          },
          24 * 1024 * 1024,
          false,
        );
        if (signal.aborted) return null;
        if (share || entry.kind === "file") {
          await shareBinary(payload);
          return null;
        }
        if (
          entry.kind === "image"
            ? !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
                payload.contentType,
              )
            : !["audio/flac", "audio/mpeg", "audio/wav"].includes(
                payload.contentType,
              )
        )
          throw new Error(
            "The public media content format could not be played.",
          );
        return cacheBinary(payload).uri;
      },
      (value) => {
        if (value) setUri(value);
      },
    ).catch(() => {});
  }
  return (
    <Screen>
      <Title localize>Anonymous media and files</Title>
      <Copy muted>
        Public availability and daily limits are confirmed by OpenJM. Resource
        credentials stay in secure device storage. No request is automatically
        repeated after interruption.
      </Copy>
      <Feedback message={error} />
      {selected ? (
        <>
          <Title>{selected.name}</Title>
          <Copy>
            {selected.kind} ·{" "}
            {status ??
              (selected.kind === "file"
                ? "Saved file"
                : "Status not confirmed")}
          </Copy>
          {uri && selected.kind !== "file" && (
            <MediaPlayer kind={selected.kind} uri={uri} />
          )}
          {selected.kind !== "file" && (
            <Button
              label="Refresh anonymous job"
              secondary
              disabled={busy}
              onPress={() => void refresh()}
            />
          )}
          {selected.kind !== "file" && status === "completed" && (
            <Button
              label="View anonymous media"
              disabled={busy}
              onPress={() => void download()}
            />
          )}
          {(selected.kind === "file" || status === "completed") && (
            <Button
              label="Save or share anonymous result"
              secondary
              disabled={busy}
              onPress={() => void download(true)}
            />
          )}
          <Button
            label="Back to anonymous resources"
            secondary
            disabled={busy}
            onPress={() => {
              setSelected(null);
              setUri(null);
            }}
          />
        </>
      ) : (
        <>
          <Button
            label="image"
            secondary
            disabled={busy || attempted}
            onPress={() => setKind("image")}
          />
          <Button
            label="music"
            secondary
            disabled={busy || attempted}
            onPress={() => setKind("music")}
          />
          <Field
            label="Anonymous media prompt"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            maxLength={kind === "image" ? 1000 : 2000}
            editable={!busy && !attempted}
          />
          {kind === "image" ? (
            <>
              <Field
                label="Negative prompt"
                value={negative}
                onChangeText={setNegative}
                maxLength={1000}
                editable={!busy && !attempted}
              />
              <Field
                label="Image size (optional)"
                value={size}
                onChangeText={setSize}
                maxLength={32}
                editable={!busy && !attempted}
              />
            </>
          ) : (
            <>
              <Field
                label="Lyrics (optional)"
                value={lyrics}
                onChangeText={setLyrics}
                multiline
                maxLength={8000}
                editable={!busy && !attempted}
              />
              <Field
                label="Duration in seconds"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                editable={!busy && !attempted}
              />
              <Field
                label="Steps (optional)"
                value={steps}
                onChangeText={setSteps}
                keyboardType="number-pad"
                editable={!busy && !attempted}
              />
              <Field
                label="Seed (optional)"
                value={seed}
                onChangeText={setSeed}
                keyboardType="numbers-and-punctuation"
                editable={!busy && !attempted}
              />
              <Field
                label="Vocal language (optional)"
                value={language}
                onChangeText={setLanguage}
                maxLength={64}
                editable={!busy && !attempted}
              />
            </>
          )}
          <Button
            label={`Generate anonymous ${kind}`}
            busy={busy}
            disabled={attempted || !prompt.trim()}
            onPress={() => void generate()}
          />
          {attempted && (
            <>
              <Copy muted>
                If submission was interrupted before a job credential arrived,
                its outcome is unknown. A separate request may create another
                result.
              </Copy>
              <Button
                label="Start separate anonymous request"
                secondary
                disabled={busy}
                onPress={() => setAttempted(false)}
              />
            </>
          )}
          <Button
            label="Refresh anonymous resources"
            secondary
            disabled={busy}
            onPress={() => void list()}
          />
          {entries.map((entry) => (
            <Row
              key={entry.credential}
              title={entry.name || entry.id}
              detail={entry.kind}
              onPress={() => void select(entry)}
            />
          ))}
        </>
      )}
    </Screen>
  );
}
