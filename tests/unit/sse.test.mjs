import { test } from "node:test";
import assert from "node:assert/strict";
import { SseParser } from "../../src/api/sse.ts";
test("UTF-8 split bytes, CRLF and multiline event data survive incremental input", () => {
  const events = [];
  const parser = new SseParser((event) => events.push(event));
  const decoder = new TextDecoder();
  const bytes = new TextEncoder().encode(
    ": heartbeat\r\nid: 12-0\r\nevent: token\r\ndata: café\r\ndata: second\r\n\r\ndata: [DONE]\n\n",
  );
  for (const byte of bytes)
    parser.push(decoder.decode(new Uint8Array([byte]), { stream: true }));
  parser.push(decoder.decode());
  parser.finish();
  assert.deepEqual(events, [
    { id: "12-0", event: "token", data: "café\nsecond" },
    { id: "12-0", event: "message", data: "[DONE]" },
  ]);
});
test("partial event is not dispatched; oversized events are rejected", () => {
  const events = [];
  const parser = new SseParser((event) => events.push(event), 40);
  parser.push("data: incomplete");
  parser.finish();
  assert.equal(events.length, 0);
  assert.throws(() => parser.push("x".repeat(50)));
});
