import { asRecord, asText, resourceId } from "../apps/appModel.ts";
export type MediaKind = "image" | "video" | "music";
// Preserve the existing product release restriction. Catalog presence does not lift it.
export const VIDEO_GENERATION_AVAILABLE = false;
export function mediaKind(value: unknown): MediaKind {
  if (value !== "image" && value !== "video" && value !== "music")
    throw new Error("This media type is unavailable.");
  return value;
}
export const generationPath = (kind: MediaKind) =>
  kind === "image"
    ? "/v1/images/generations"
    : kind === "video"
      ? "/v1/videos"
      : "/v1/audio/music";
export type MediaJob = {
  id: string;
  status: string | null;
  submission: string | null;
  imageId: string | null;
  progress: number | null;
  stage: string | null;
};
export function mediaJob(
  value: unknown,
  kind: MediaKind,
  expectedId?: string,
): MediaJob {
  let raw = asRecord(value);
  if (raw.status === "success") raw = asRecord(raw.data);
  const id = resourceId(raw.id);
  if (expectedId && id !== expectedId)
    throw new Error("The media response did not match this job.");
  const states =
    kind === "image"
      ? ["queued", "generating", "completed", "failed"]
      : kind === "video"
        ? [
            "queued",
            "deferred",
            "rendering",
            "encoding",
            "completed",
            "failed",
            "cancelled",
            "cancelling",
          ]
        : [
            "queued",
            "planning",
            "deferred",
            "generating",
            "completed",
            "failed",
          ];
  const status = asText(raw.status),
    submission = asText(raw.submission_state);
  if (status && !states.includes(status))
    throw new Error("The media state could not be used.");
  if (
    !status &&
    (kind !== "music" ||
      !["submitting", "uncertain", "rejected"].includes(submission ?? ""))
  )
    throw new Error("The media state could not be used.");
  if (
    kind === "music" &&
    !["submitting", "accepted", "uncertain", "rejected"].includes(
      submission ?? "",
    )
  )
    throw new Error("The music submission state could not be used.");
  return {
    id,
    status,
    submission,
    imageId:
      kind === "image" && raw.image_id != null
        ? resourceId(raw.image_id)
        : null,
    progress:
      typeof raw.progress === "number" && Number.isFinite(raw.progress)
        ? raw.progress
        : null,
    stage: asText(raw.stage),
  };
}
export function contentPath(kind: MediaKind, job: MediaJob) {
  if (job.status !== "completed")
    throw new Error("The media result is not complete yet.");
  if (kind === "image" && !job.imageId)
    throw new Error("The completed image identifier was not supplied.");
  return kind === "image"
    ? `/v1/images/${job.imageId}/content`
    : `${generationPath(kind)}/${job.id}/content`;
}
export type MediaOptions = {
  prompt: string;
  model: string;
  conversationId: string;
  seed: string;
  steps: string;
  size: string;
  negative: string;
  duration: string;
  aspect: string;
  quality: string;
  mode: string;
  audio: boolean;
  lyricsMode: string;
  lyrics: string;
  language: string;
};
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function number(
  value: string,
  label: string,
  min: number,
  max: number,
  integer = false,
) {
  if (!value.trim()) return undefined;
  const result = Number(value);
  if (
    !Number.isFinite(result) ||
    result < min ||
    result > max ||
    (integer && !Number.isSafeInteger(result))
  )
    throw new Error(`${label} is outside the supported limits.`);
  return result;
}
export function mediaRequest(
  kind: MediaKind,
  options: MediaOptions,
  requestId: string,
) {
  if (!uuid.test(options.conversationId) || !uuid.test(requestId))
    throw new Error(
      "A saved conversation and valid request identifier are required.",
    );
  if (
    !options.model ||
    !options.prompt.trim() ||
    options.prompt.length > (kind === "music" ? 2000 : 4000)
  )
    throw new Error("Enter a prompt within this model's limits.");
  const result: Record<string, unknown> = {
    conversation_id: options.conversationId,
    model: options.model,
    prompt: options.prompt,
    seed: number(
      options.seed,
      "Seed",
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
      true,
    ),
  };
  if (kind === "image") {
    if (options.size) {
      const match = options.size.match(/^(\d+)x(\d+)$/);
      if (
        !match ||
        match
          .slice(1)
          .some(
            (value) =>
              Number(value) < 256 || Number(value) > 1536 || Number(value) % 8,
          )
      )
        throw new Error(
          "Image dimensions must be multiples of 8 from 256 to 1536.",
        );
      result.size = options.size;
    }
    if (options.negative.length > 4000)
      throw new Error("The negative prompt is too long.");
    result.steps = number(options.steps, "Steps", 1, 100, true);
    if (options.negative) result.negative_prompt = options.negative;
  } else if (kind === "video") {
    if (
      options.model !== "openjm-video-1" ||
      !["16:9", "9:16", "1:1"].includes(options.aspect) ||
      !["fast", "quality", "cinema"].includes(options.quality) ||
      !["clip", "film"].includes(options.mode)
    )
      throw new Error("Choose supported video options.");
    Object.assign(result, {
      duration: number(options.duration, "Duration", 1, 170),
      aspect_ratio: options.aspect,
      quality: options.quality,
      mode: options.mode,
      audio: options.audio,
    });
  } else {
    if (
      options.model !== "openjm-music-1" ||
      options.lyrics.length > 8000 ||
      !options.language.trim() ||
      options.language.length > 64 ||
      !["automatic", "instrumental", "custom"].includes(options.lyricsMode)
    )
      throw new Error("Choose supported music options.");
    Object.assign(result, {
      request_id: requestId,
      duration_seconds: number(options.duration, "Duration", 10, 600),
      steps: number(options.steps, "Steps", 1, 60, true),
      vocal_language: options.language.trim(),
    });
    if (options.lyricsMode !== "automatic")
      result.lyrics =
        options.lyricsMode === "instrumental" ? "" : options.lyrics;
  }
  return result;
}
