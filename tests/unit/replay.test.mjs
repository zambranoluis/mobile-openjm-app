import test from "node:test";
import assert from "node:assert/strict";
import { activeResponse } from "../../src/features/conversations/replayState.ts";
import { MobileClient } from "../../src/api/client.ts";
const streamId = "a7086f62-3f1a-44d5-a372-3cbb2c37fe71";
const credential = {
  accessToken: "fixture",
  refreshToken: "refresh",
  userId: "fixture",
  accessTokenExpiresAt: "2099-01-01T00:00:00Z",
  sessionExpiresAt: "2099-01-02T00:00:00Z",
};
test("replay state must belong to the requested conversation and retain authoritative status", () => {
  assert.equal(activeResponse(undefined, "conversation"), null);
  const value = {
    streamId,
    conversationId: "conversation",
    clientSubmissionId: "once",
    status: "streaming",
  };
  assert.deepEqual(activeResponse(value, "conversation"), value);
  assert.throws(() => activeResponse(value, "different"));
  assert.throws(() =>
    activeResponse({ ...value, status: "imagined" }, "conversation"),
  );
});
test("native resume uses GET with a distinct conversation cursor and never repeats the submission", async () => {
  const calls = [];
  const client = new MobileClient(
    "https://mobile.example.test",
    async () => streamId,
    { read: async () => null, write: async () => {}, remove: async () => {} },
    async (url, options) => {
      calls.push({ url, options });
      return new Response(
        'id: 10-2\ndata: {"choices":[{"delta":{"content":"continued"}}]}\n\nid: 10-3\ndata: [DONE]\n\n',
        {
          headers: {
            "content-type": "text/event-stream",
            "x-openjm-stream-id": streamId,
          },
        },
      );
    },
  );
  await client.session.accept(credential);
  const events = [];
  await client.resume(
    `/v1/conversations/conversation/streams/${streamId}`,
    (event) => events.push(event),
    new AbortController().signal,
    "10-1",
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.body, undefined);
  assert.equal(calls[0].options.headers.get("last-event-id"), "10-1");
  assert.deepEqual(
    events.map((e) => e.id),
    ["10-2", "10-3"],
  );
  await assert.rejects(() =>
    client.resume(
      "/v1/conversations/conversation/streams/fixture",
      () => {},
      new AbortController().signal,
      "upstream-job-cursor",
    ),
  );
  assert.equal(calls.length, 1);
});
