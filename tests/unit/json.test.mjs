import { test } from "node:test";
import assert from "node:assert/strict";
import { boundedJson } from "../../src/api/json.ts";
test("JSON decoding preserves split UTF-8 and cancels oversized declared or streamed responses", async () => {
  const content = new TextEncoder().encode('{"value":"fictional 漢字"}');
  const response = new Response(
    new ReadableStream({
      start(controller) {
        for (const byte of content) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    }),
  );
  assert.deepEqual(await boundedJson(response, 128), {
    value: "fictional 漢字",
  });
  let canceled = false;
  await assert.rejects(
    () =>
      boundedJson(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(129));
            },
            cancel() {
              canceled = true;
            },
          }),
        ),
        128,
      ),
    /device limit/,
  );
  assert.equal(canceled, true);
  await assert.rejects(
    () =>
      boundedJson(
        new Response("{}", { headers: { "content-length": "129" } }),
        128,
      ),
    /device limit/,
  );
});
