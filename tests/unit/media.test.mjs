import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mediaRequest,
  mediaJob,
  contentPath,
  VIDEO_GENERATION_AVAILABLE,
} from "../../src/features/media/mediaModel.ts";
import { mediaHistory } from "../../src/features/media/mediaHistory.ts";
import { notificationTarget } from "../../src/platform/notificationModel.ts";
const id = "12345678-1234-4321-9876-123456789abc";
const options = {
  conversationId: id,
  model: "fictional-image-model",
  prompt: "Fictional forest",
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
};
test("native media requests preserve per-operation limits and durable music identity", () => {
  assert.equal(mediaRequest("image", options, id).conversation_id, id);
  assert.throws(() =>
    mediaRequest("image", { ...options, size: "1025x1024" }, id),
  );
  assert.throws(() => mediaRequest("image", { ...options, steps: "101" }, id));
  assert.throws(() =>
    mediaRequest(
      "music",
      { ...options, model: "openjm-music-1", duration: "9" },
      id,
    ),
  );
  const music = mediaRequest(
    "music",
    {
      ...options,
      model: "openjm-music-1",
      duration: "30",
      lyricsMode: "instrumental",
    },
    id,
  );
  assert.equal(music.request_id, id);
  assert.equal(music.lyrics, "");
  assert.equal(music.voice_id, undefined);
  assert.equal(VIDEO_GENERATION_AVAILABLE, false);
});
test("media responses preserve unconfirmed music and prohibit mismatched or premature result reads", () => {
  const music = mediaJob(
    { id, submission_state: "uncertain", status: null },
    "music",
    id,
  );
  assert.equal(music.status, null);
  assert.throws(() => contentPath("music", music));
  assert.throws(() =>
    mediaJob(
      { id, status: "completed", image_id: id },
      "image",
      "different-job",
    ),
  );
  assert.throws(() =>
    contentPath(
      "image",
      mediaJob({ id, status: "completed", image_id: null }, "image"),
    ),
  );
  assert.equal(
    contentPath(
      "image",
      mediaJob({ id, status: "completed", image_id: id }, "image"),
    ),
    `/v1/images/${id}/content`,
  );
  assert.equal(
    mediaJob({ id, status: "cancelling" }, "video").status,
    "cancelling",
  );
});
test("saved media identifiers remain account-isolated and concurrent additions survive", async () => {
  const data = new Map(),
    history = mediaHistory({
      getItem: async (key) => data.get(key) ?? null,
      setItem: async (key, value) => {
        data.set(key, value);
      },
    });
  const item = {
    kind: "music",
    id,
    conversationId: id,
    createdAt: "2026-10-08T00:00:00Z",
  };
  await Promise.all([
    history.save("fictional-a", item),
    history.save("fictional-a", { ...item, kind: "image" }),
  ]);
  assert.equal((await history.read("fictional-a")).length, 2);
  assert.deepEqual(await history.read("fictional-b"), []);
});
test("completion links distinguish namespaced media resources and reject unsupported resource types", () => {
  const event = { eventId: id, accountId: id, jobId: id };
  assert.equal(
    notificationTarget({ ...event, resourceType: "music" }).resourceType,
    "music",
  );
  assert.equal(
    notificationTarget({
      ...event,
      resourceType: "https://unexpected.example",
    }),
    null,
  );
});
