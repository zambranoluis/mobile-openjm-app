import { test } from "node:test";
import assert from "node:assert/strict";
import { responseDetails, structuredResponse } from "../../src/features/conversations/responseDetails.ts";
test("response details preserve authoritative zero and absent values separately", () => {
  const details = responseDetails({ id: "fictional", role: "assistant", content: "Answer", token_usage: { total: 0 },
    quotes: [{ source: "Fictional brief", excerpt: "One shared session", reference: "Section 1" }],
    context_files: [{ file_id: "file_demo", filename: "brief.txt", bytes: 0 }], work_duration_ms: 12000 });
  assert.equal(details.usage.total, 0);
  assert.equal(details.usage.entry, null);
  assert.equal(details.duration, 12000);
  assert.equal(details.context[0].bytes, 0);
  assert.equal(details.quotes[0].reference, "Section 1");
  assert.equal(details.incomplete, false);
  assert.equal(responseDetails({ id: "x", role: "assistant", content: "", context_files: [{ filename: "missing-id" }] }).incomplete, true);
});
test("structured thinking and answer stay distinct across incomplete tags and independent reasoning", () => {
  assert.deepEqual(structuredResponse("<think>Plan</think><answer>Result</answer>"), { content: "Result", thinking: "Plan" });
  assert.deepEqual(structuredResponse("<think>Partial", "", true), { content: "", thinking: "Partial" });
  assert.deepEqual(structuredResponse("<think>Plan</think><ans", "", true), { content: "", thinking: "Plan" });
  assert.deepEqual(structuredResponse("Answer", "Supplied reasoning", true), { content: "Answer", thinking: "Supplied reasoning" });
});
