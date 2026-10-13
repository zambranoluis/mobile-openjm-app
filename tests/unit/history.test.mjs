import { test } from "node:test";
import assert from "node:assert/strict";
import { historyPage, historyQuery, historySections } from "../../src/features/conversations/historyModel.ts";

test("history filters use the authoritative updated date contract across local day boundaries", () => {
  const day = new Date(2026, 9, 8, 12);
  const query = new URL(historyQuery({ query: " garden ", after: day, before: day, cursor: "next/cursor", groupId: "owned-group" }), "https://example.invalid").searchParams;
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(day); end.setHours(23, 59, 59, 999);
  assert.equal(query.get("updated_after"), start.toISOString());
  assert.equal(query.get("updated_before"), end.toISOString());
  assert.equal(query.get("q"), "garden");
  assert.equal(query.get("cursor"), "next/cursor");
  assert.equal(query.get("group_id"), "owned-group");
  assert.throws(() => historyQuery({ query: "", after: new Date(2026, 9, 9), before: day }), /start date/);
});
test("history rejects unusable records and keeps supplied date ordering without inventing dates", () => {
  const row = { id: "owned", title: "Fictional", model: null, preview: null, updated_at: "invalid" };
  assert.equal(historySections([row])[0].title, "Date unavailable");
  assert.deepEqual(historyPage({ data: [row], next_cursor: null }).items, [row]);
  assert.throws(() => historyPage({ data: [{ ...row, title: 4 }], next_cursor: null }), /could not be used/);
  assert.throws(() => historyPage({ data: [row] }), /could not be used/);
});
