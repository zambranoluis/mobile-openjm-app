import { test } from "node:test";
import assert from "node:assert/strict";
import {
  jobState,
  jobContent,
  upstreamJobCursor,
} from "../../src/features/conversations/jobModel.ts";
test("response job identity and status are validated without inventing queued state", () => {
  assert.throws(() => jobState({ job_id: "fixture", status: undefined }));
  assert.throws(() =>
    jobState({ job_id: "foreign", status: "completed" }, "fixture"),
  );
  assert.equal(
    jobState({ job_id: "fixture", status: "cancellation_requested" }, "fixture")
      .status,
    "cancellation_requested",
  );
  assert.equal(
    jobContent({ result: { content: "Fictional result" } }),
    "Fictional result",
  );
  assert.equal(
    jobContent({
      result: { choices: [{ message: { content: "Compatible result" } }] },
    }),
    "Compatible result",
  );
  assert.equal(upstreamJobCursor("123-0"), null);
  assert.equal(upstreamJobCursor("2147483648"), null);
  assert.equal(upstreamJobCursor("0007"), "7");
  assert.throws(() =>
    jobContent(
      {
        job_id: "foreign",
        status: "completed",
        result: { content: "private" },
      },
      "fixture",
    ),
  );
  assert.throws(() =>
    jobContent(
      { job_id: "fixture", status: "running", result: { content: "partial" } },
      "fixture",
    ),
  );
  assert.equal(
    jobContent(
      {
        job_id: "fixture",
        status: "completed",
        result: { content: "confirmed" },
      },
      "fixture",
    ),
    "confirmed",
  );
});
