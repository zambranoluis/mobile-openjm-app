import { test } from "node:test";
import assert from "node:assert/strict";
import { preferences } from "../../src/features/account/preferenceModel.ts";
import {
  usageDetails,
  usageWindow,
} from "../../src/features/account/usageDetailsModel.ts";
test("preferences require server booleans and the accepted memory limit", () => {
  const valid = {
    enabled: true,
    form: true,
    max_items: 6,
    web_search_enabled: false,
  };
  assert.deepEqual(preferences(valid), valid);
  for (const changed of [
    { enabled: "true" },
    { max_items: 0 },
    { max_items: 51 },
    { form: null },
    { web_search_enabled: undefined },
  ])
    assert.throws(() => preferences({ ...valid, ...changed }));
});
test("usage preserves unknown counts, incomplete sync and progressing pagination", () => {
  const event = {
    id: "fixture-event",
    created_at: "2026-01-01T00:00:00Z",
    model: "fixture-chat",
    token_source: "missing",
  };
  const page = usageDetails(
    {
      data: [event, event, { id: "broken" }],
      has_more: true,
      next_offset: 25,
      is_partial: true,
    },
    0,
  );
  assert.equal(page.data.length, 1);
  assert.equal(page.data[0].tokens, null);
  assert.equal(page.partial, true);
  assert.equal(page.nextOffset, 25);
  assert.throws(() =>
    usageDetails({ data: [], has_more: true, next_offset: 25 }, 25),
  );
  assert.throws(() => usageWindow("invalid", "2026-01-02"));
  assert.throws(() => usageWindow("2026-01-03", "2026-01-02"));
});
