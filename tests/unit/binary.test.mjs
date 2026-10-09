import { test } from "node:test";
import assert from "node:assert/strict";
import { MobileClient } from "../../src/api/client.ts";
const credentials = {
  accessToken: "fictional-access",
  refreshToken: "fictional-refresh",
  userId: "fixture",
  accessTokenExpiresAt: new Date(Date.now() + 600000).toISOString(),
  sessionExpiresAt: new Date(Date.now() + 86400000).toISOString(),
};
async function client(fetch) {
  const api = new MobileClient(
    "https://mobile.example.test",
    async () => "fictional-installation",
    { read: async () => null, write: async () => {}, remove: async () => {} },
    fetch,
  );
  await api.session.accept(credentials);
  return api;
}
test("native binary transport preserves bytes and explicit archive MIME types", async () => {
  const bytes = new Uint8Array([0x50, 0x4b, 3, 4, 0, 255, 42]);
  const api = await client(async (_url, options) => {
    assert.equal(
      new Headers(options.headers).get("content-type"),
      "application/zip",
    );
    assert.equal(
      new Headers(options.headers).get("authorization"),
      "Bearer fictional-access",
    );
    return new Response(bytes, {
      headers: { "content-type": "application/zip" },
    });
  });
  const result = await api.binary("/v1/memory/export", {
    method: "POST",
    headers: { "content-type": "application/zip" },
    body: bytes,
  });
  assert.deepEqual(result.bytes, bytes);
  assert.equal(result.contentType, "application/zip");
});
test("downloads stop on a streamed size overflow even without a declared content length", async () => {
  let canceled = false;
  const api = await client(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(11));
          },
          cancel() {
            canceled = true;
          },
        }),
      ),
  );
  await assert.rejects(
    api.binary("/v1/files/fixture/content", {}, 10),
    /too large/,
  );
  assert.equal(canceled, true);
});
test("logout during a binary read discards the old account's bytes", async () => {
  let output;
  const api = await client(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            output = controller;
          },
        }),
      ),
  );
  const reading = api.binary("/v1/files/fixture/content");
  while (!output) await new Promise((resolve) => setTimeout(resolve, 0));
  await api.session.clear();
  output.enqueue(new Uint8Array([42]));
  await assert.rejects(reading, { code: "SESSION_CHANGED" });
});
