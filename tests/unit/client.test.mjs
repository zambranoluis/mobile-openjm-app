import { test } from "node:test";
import assert from "node:assert/strict";
import { MobileClient } from "../../src/api/client.ts";
const credentials = {
  accessToken: "fictional-access",
  refreshToken: "fictional-refresh",
  userId: "fixture-user",
  accessTokenExpiresAt: new Date(Date.now() + 600000).toISOString(),
  sessionExpiresAt: new Date(Date.now() + 86400000).toISOString(),
};

test("upstream job cursors remain distinct from Redis conversation cursors", async () => {
  const seen = [];
  const api = client(async (_url, options) => {
    seen.push(new Headers(options.headers).get("last-event-id"));
    return new Response("data: [DONE]\n\n", {
      headers: { "content-type": "text/event-stream" },
    });
  });
  await api.session.accept(credentials);
  const signal = new AbortController().signal;
  await api.resumeJob("/v1/jobs/fixture-job/stream", () => {}, signal, "0007");
  assert.deepEqual(seen, ["7"]);
  await assert.rejects(() =>
    api.resumeJob("/v1/jobs/fixture-job/stream", () => {}, signal, "123-0"),
  );
  await assert.rejects(() =>
    api.resume(
      "/v1/conversations/fixture/streams/fixture",
      () => {},
      signal,
      "7",
    ),
  );
  await assert.rejects(() =>
    api.resumeJob(
      "/v1/conversations/fixture/streams/fixture",
      () => {},
      signal,
      "7",
    ),
  );
  assert.equal(seen.length, 1);
});
test("anonymous binary reads neither send bearer nor refresh an account on unauthorized resource tokens", async () => {
  let calls = 0;
  const api = client(async (_url, options) => {
    calls++;
    const headers = new Headers(options.headers);
    assert.equal(headers.get("authorization"), null);
    assert.equal(headers.get("x-openjm-job-token"), "fictional-resource");
    return Response.json({ code: "INVALID_RESOURCE_TOKEN" }, { status: 401 });
  });
  await api.session.accept(credentials);
  await assert.rejects(
    () =>
      api.binary(
        "/v1/public/audio/music/fictional/content",
        {
          headers: {
            "x-openjm-job-token": "fictional-resource",
            authorization: "Bearer must-not-leak",
          },
        },
        1024,
        false,
      ),
    { status: 401 },
  );
  assert.equal(calls, 1);
});
test("a stream from an old account cannot deliver events after sign-out", async () => {
  let pending;
  let opened = false;
  const api = client(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            pending = controller;
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      ),
  );
  await api.session.accept(credentials);
  const emitted = [];
  const reading = api.stream(
    "/v1/conversations/fixture/messages",
    {},
    (event) => emitted.push(event),
    new AbortController().signal,
    () => {
      opened = true;
    },
  );
  while (!opened) await new Promise((resolve) => setTimeout(resolve, 0));
  await api.session.clear();
  pending.enqueue(
    new TextEncoder().encode(
      'data: {"choices":[{"delta":{"content":"old private data"}}]}\n\n',
    ),
  );
  await assert.rejects(reading, { code: "SESSION_CHANGED" });
  assert.deepEqual(emitted, []);
});
test("anonymous streaming needs no account credentials and never attaches bearer", async () => {
  const api = client(async (_url, options) => {
    assert.equal(new Headers(options.headers).get("authorization"), null);
    return new Response(
      'data: {"choices":[{"delta":{"content":"Fictional"}}]}\n\ndata: [DONE]\n\n',
      { headers: { "content-type": "text/event-stream" } },
    );
  });
  const events = [];
  await api.stream(
    "/v1/public/chat/completions",
    { message: "Fictional" },
    (event) => events.push(event),
    new AbortController().signal,
    undefined,
    false,
  );
  assert.equal(events.length, 2);
});
function client(transport) {
  const store = {
    read: async () => null,
    write: async () => {},
    remove: async () => {},
  };
  return new MobileClient(
    "https://mobile.example.test",
    async () => "11111111-1111-1111-1111-111111111111",
    store,
    transport,
  );
}
test("unauthorized mutations are not retried or repeated", async () => {
  let calls = 0;
  const api = client(async () => {
    calls++;
    return Response.json(
      { code: "AUTH_REQUIRED", message: "Expired" },
      { status: 401 },
    );
  });
  await api.session.accept(credentials);
  await assert.rejects(
    api.request("/v1/conversations", { method: "POST", body: "{}" }),
    { status: 401 },
  );
  assert.equal(calls, 1);
});
test("stream EOF is incomplete unless the terminal event is present", async () => {
  const api = client(
    async () =>
      new Response("data: partial\n\n", {
        headers: { "content-type": "text/event-stream" },
      }),
  );
  await api.session.accept(credentials);
  const events = [];
  await assert.rejects(
    api.stream(
      "/v1/conversations/id/messages",
      {},
      (event) => events.push(event),
      new AbortController().signal,
    ),
    { code: "STREAM_INTERRUPTED" },
  );
  assert.equal(events[0].data, "partial");
});
test("completed streams keep framing and cancel the reader; cross-origin paths fail", async () => {
  let closed = false;
  const api = client(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                "id: 2-0\ndata: café\n\ndata: [DONE]\n\n",
              ),
            );
          },
          cancel() {
            closed = true;
          },
        }),
        {
          headers: {
            "content-type": "text/event-stream",
            "x-openjm-stream-id": "fixture-stream",
          },
        },
      ),
  );
  await api.session.accept(credentials);
  const events = [];
  assert.equal(
    await api.stream(
      "/v1/conversations/id/messages",
      {},
      (event) => events.push(event),
      new AbortController().signal,
    ),
    "fixture-stream",
  );
  assert.equal(closed, true);
  assert.equal(events.length, 2);
  await assert.rejects(api.request("//evil.example.test/v1/me"));
});
test("an old account response cannot be delivered after logout and a new sign-in", async () => {
  let deliver;
  const api = client(
    async () =>
      new Promise((resolve) => {
        deliver = resolve;
      }),
  );
  await api.session.accept(credentials);
  const reading = api.request("/v1/me");
  while (!deliver) await new Promise((resolve) => setTimeout(resolve, 0));
  await api.session.clear();
  await api.session.accept({ ...credentials, userId: "other-fixture-user" });
  deliver(Response.json({ id: "old-fixture-user" }));
  await assert.rejects(reading, { code: "SESSION_CHANGED" });
});
