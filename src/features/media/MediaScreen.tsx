import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { cacheBinary, shareBinary } from "../../platform/exports";
import { MediaPlayer } from "../../platform/MediaPlayer";
import { asRecord, asText, resourceId } from "../apps/appModel";
import type { Model } from "../../api/types";
import { useAuth } from "../auth/AuthProvider";
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
import {
  generationPath,
  mediaJob,
  mediaRequest,
  VIDEO_GENERATION_AVAILABLE,
} from "./mediaModel";
import type { MediaKind, MediaOptions } from "./mediaModel";
import { mediaHistory } from "./mediaHistory";
import type { MediaRecord } from "./mediaHistory";
const history = mediaHistory(AsyncStorage);
export function MediaScreen({ conversationId }: { conversationId: string }) {
  const { profile } = useAuth(),
    { run, busy, error } = useFeatureTask();
  const [kind, setKind] = useState<MediaKind>("image"),
    [models, setModels] = useState<Model[]>([]),
    [records, setRecords] = useState<MediaRecord[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState<
      { kind: MediaKind; id: string; title: string }[]
    >([]),
    [imageUri, setImageUri] = useState<string | null>(null);
  const [options, setOptions] = useState<MediaOptions>({
    conversationId,
    prompt: "",
    model: "",
    seed: "",
    steps: "",
    size: "",
    negative: "",
    duration: "",
    aspect: "16:9",
    quality: "fast",
    mode: "clip",
    audio: false,
    lyricsMode: "automatic",
    lyrics: "",
    language: "en",
  });
  const change = (key: keyof MediaOptions, value: string | boolean) =>
    setOptions((current) => ({ ...current, [key]: value }));
  const load = useCallback(
    () =>
      run(
        async (signal) => {
          const value = await api.request<{ data: Model[] }>("/v1/models", {
            signal,
          });
          const detail = asRecord(
            await api.request(
              `/v1/conversations/${encodeURIComponent(conversationId)}`,
              { signal },
            ),
          );
          if (detail.id !== conversationId)
            throw new Error("The saved media did not match this conversation.");
          const saved: { kind: MediaKind; id: string; title: string }[] = [];
          for (const [key, kind, idKey] of [
            ["generated_images", "image", "image_id"],
            ["generated_videos", "video", "job_id"],
            ["generated_music", "music", "id"],
          ] as const) {
            const list = detail[key];
            if (list !== undefined && !Array.isArray(list))
              throw new Error("Saved media could not be read.");
            for (const item of (list as unknown[] | undefined) ?? []) {
              const raw = asRecord(item);
              saved.push({
                kind,
                id: resourceId(raw[idKey]),
                title: asText(raw.prompt) ?? `${kind} result`,
              });
            }
          }
          if (!Array.isArray(value.data))
            throw new Error("The model catalog could not be read.");
          return {
            saved,
            models: value.data.filter(
              (item) =>
                item && typeof item.id === "string" && item.capabilities?.kind,
            ),
            records: profile
              ? (await history.read(profile.id)).filter(
                  (item) => item.conversationId === conversationId,
                )
              : [],
          };
        },
        (value) => {
          setSaved(value.saved);
          setModels(value.models);
          setRecords(value.records);
        },
      ),
    [run, profile, conversationId],
  );
  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
      return () => setImageUri(null);
    }, [load]),
  );
  const available = models.filter(
    (item) =>
      item.capabilities?.kind === kind &&
      !["disabled", "unavailable", "failed"].includes(item.status ?? "") &&
      (kind !== "music" || item.id === "openjm-music-1"),
  );
  const selected = available.find((item) => item.id === options.model);
  async function generate() {
    if (
      !profile ||
      attempted ||
      !selected ||
      (kind === "video" && !VIDEO_GENERATION_AVAILABLE)
    )
      return;
    await run(
      async (signal) => {
        const requestId = Crypto.randomUUID(),
          body = mediaRequest(kind, options, requestId);
        // Music's durable request UUID allows a read after an ambiguous submission.
        if (kind === "music")
          await history.save(profile.id, {
            kind,
            id: requestId,
            conversationId,
            createdAt: new Date().toISOString(),
          });
        setAttempted(true);
        const value = mediaJob(
          await api.request(generationPath(kind), {
            method: "POST",
            signal,
            body: JSON.stringify(body),
            headers:
              kind === "video" ? { "Idempotency-Key": requestId } : undefined,
          }),
          kind,
          kind === "music" ? requestId : undefined,
        );
        await history.save(profile.id, {
          kind,
          id: value.id,
          conversationId,
          createdAt: new Date().toISOString(),
        });
        return value;
      },
      (value) =>
        router.push({
          pathname: "/media/[kind]/[id]",
          params: { kind, id: value.id },
        }),
    ).catch(() => {});
    void load().catch(() => {});
  }
  return (
    <Screen>
      <Title localize>Create media</Title>
      <Feedback message={error} />
      <Copy muted>
        Generation uses this saved conversation and the account’s server quota.
      </Copy>
      {(["image", "video", "music"] as const).map((value) => (
        <Button
          key={value}
          label={kind === value ? `Selected: ${value}` : value}
          secondary
          disabled={busy || attempted}
          onPress={() => {
            setKind(value);
            change("model", "");
          }}
        />
      ))}
      {kind === "video" ? (
        <Copy>
          Video generation is unavailable in the current product release.
          Existing video results remain accessible.
        </Copy>
      ) : (
        <>
          {!available.length && (
            <Copy>No available {kind} model was supplied by OpenJM.</Copy>
          )}
          {available.map((item) => (
            <Button
              key={item.id}
              label={
                options.model === item.id ? `Selected: ${item.id}` : item.id
              }
              secondary
              disabled={busy || attempted}
              onPress={() => change("model", item.id)}
            />
          ))}
          <Field
            label="Media prompt"
            multiline
            value={options.prompt}
            editable={!busy && !attempted}
            onChangeText={(value) => change("prompt", value)}
          />
          <Field
            label="Seed (optional)"
            keyboardType="numbers-and-punctuation"
            value={options.seed}
            editable={!busy && !attempted}
            onChangeText={(value) => change("seed", value)}
          />
          <Field
            label="Steps (optional)"
            keyboardType="number-pad"
            value={options.steps}
            editable={!busy && !attempted}
            onChangeText={(value) => change("steps", value)}
          />
          {kind === "image" ? (
            <>
              <Field
                label="Image size (optional, width x height)"
                placeholder="1024x1024"
                value={options.size}
                editable={!busy && !attempted}
                onChangeText={(value) => change("size", value)}
              />
              <Field
                label="Negative prompt (optional)"
                multiline
                value={options.negative}
                editable={!busy && !attempted}
                onChangeText={(value) => change("negative", value)}
              />
            </>
          ) : (
            <>
              <Field
                label="Music duration in seconds (optional)"
                keyboardType="number-pad"
                value={options.duration}
                editable={!busy && !attempted}
                onChangeText={(value) => change("duration", value)}
              />
              {(["automatic", "instrumental", "custom"] as const).map(
                (value) => (
                  <Button
                    key={value}
                    label={
                      options.lyricsMode === value
                        ? `Selected lyrics: ${value}`
                        : `Lyrics: ${value}`
                    }
                    secondary
                    disabled={busy || attempted}
                    onPress={() => change("lyricsMode", value)}
                  />
                ),
              )}
              {options.lyricsMode === "custom" && (
                <Field
                  label="Custom lyrics"
                  multiline
                  value={options.lyrics}
                  editable={!busy && !attempted}
                  onChangeText={(value) => change("lyrics", value)}
                />
              )}
              <Field
                label="Vocal language"
                value={options.language}
                editable={!busy && !attempted}
                onChangeText={(value) => change("language", value)}
              />
              <Copy muted>
                Voice cloning, enrollment and transcription are unavailable in
                the current product release.
              </Copy>
            </>
          )}
          <Button
            label={`Generate ${kind}`}
            busy={busy}
            disabled={attempted || !selected || !options.prompt.trim()}
            onPress={() => void generate()}
          />
        </>
      )}
      {attempted && (
        <>
          <Copy>
            The submission may have been accepted. Read saved results before
            intentionally creating another request. Returning here never
            resubmits it.
          </Copy>
          <Button
            label="Start a separate media request"
            secondary
            disabled={busy}
            onPress={() => {
              setAttempted(false);
              change("prompt", "");
            }}
          />
        </>
      )}
      <Title localize>Recent media on this device</Title>
      {records.map((item) => (
        <Row
          key={`${item.kind}:${item.id}`}
          title={`${item.kind} · ${item.id}`}
          detail={item.createdAt}
          onPress={() =>
            router.push({
              pathname: "/media/[kind]/[id]",
              params: { kind: item.kind, id: item.id },
            })
          }
        />
      ))}
      {!records.length && (
        <Copy muted>
          No local media request identifiers are saved for this conversation.
        </Copy>
      )}
      <Title localize>Saved conversation media</Title>
      {saved.map((item) => (
        <Row
          key={`${item.kind}:${item.id}`}
          title={`${item.kind} · ${item.title}`}
          onPress={() => {
            if (item.kind !== "image")
              router.push({
                pathname: "/media/[kind]/[id]",
                params: { kind: item.kind, id: item.id },
              });
            else
              void run(async (signal) => {
                const payload = await api.binary(
                  `/v1/images/${item.id}/content`,
                  { signal },
                );
                if (!payload.contentType.startsWith("image/"))
                  throw new Error("The image format could not be used.");
                return cacheBinary(payload).uri;
              }, setImageUri).catch(() => {});
          }}
        />
      ))}
      {imageUri && (
        <>
          <MediaPlayer kind="image" uri={imageUri} />
          <Button
            label="Dismiss image preview"
            secondary
            onPress={() => setImageUri(null)}
          />
        </>
      )}
      {saved
        .filter((item) => item.kind === "image")
        .map((item) => (
          <Button
            key={item.id}
            label={`Save image: ${item.title}`}
            secondary
            busy={busy}
            onPress={() =>
              void run(async (signal) => {
                const payload = await api.binary(
                  `/v1/images/${item.id}/content`,
                  { signal },
                );
                if (!payload.contentType.startsWith("image/"))
                  throw new Error("The image format could not be used.");
                await shareBinary(payload);
              }).catch(() => {})
            }
          />
        ))}
      {!saved.length && (
        <Copy muted>No saved conversation media was supplied.</Copy>
      )}
      <Button
        label="Refresh media catalog and history"
        secondary
        busy={busy}
        onPress={() => void load().catch(() => {})}
      />
    </Screen>
  );
}
