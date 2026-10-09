import { test } from "node:test";
import assert from "node:assert/strict";
import {
  conversationDetail,
  prependMessages,
} from "../../src/features/conversations/conversationData.ts";
test("older pages deduplicate boundaries and preserve authoritative newer content", () => {
  const older = [
      { id: "a", content: "first" },
      { id: "b", content: "old" },
    ],
    current = [
      { id: "b", content: "new" },
      { id: "c", content: "last" },
    ];
  assert.deepEqual(prependMessages(older, current), [
    older[0],
    current[0],
    current[1],
  ]);
});
test("conversation pages reject foreign data or impossible pagination", () => {
  const value = {
    id: "fixture",
    messages: [{ id: "a", role: "assistant", content: "fictional" }],
    has_more: false,
    next_cursor: null,
  };
  assert.deepEqual(conversationDetail(value, "fixture"), value);
  assert.throws(() => conversationDetail(value, "other"));
  assert.throws(() =>
    conversationDetail({ ...value, has_more: true }, "fixture"),
  );
});
