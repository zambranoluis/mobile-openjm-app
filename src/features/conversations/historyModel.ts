import type { Conversation } from "../../api/types.ts";

export function historyPage(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Conversation history could not be used.");
  const page = value as { data?: unknown; next_cursor?: unknown };
  if (!Array.isArray(page.data) || (page.next_cursor !== null && typeof page.next_cursor !== "string"))
    throw new Error("Conversation history could not be used.");
  const items = page.data as Conversation[];
  if (items.some((item) => !item || typeof item.id !== "string" || !item.id || typeof item.updated_at !== "string" ||
      [item.title, item.preview, item.model].some((field) => field !== null && field !== undefined && typeof field !== "string")))
    throw new Error("Conversation history could not be used.");
  return { items, cursor: page.next_cursor as string | null };
}

export function historySections(items: Conversation[]) {
  const sections = new Map<string, Conversation[]>();
  for (const item of items) {
    const date = new Date(item.updated_at);
    const title = Number.isNaN(date.getTime()) ? "Date unavailable" :
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const section = sections.get(title) ?? [];
    section.push(item);
    sections.set(title, section);
  }
  return [...sections].map(([title, data]) => ({ title, data }));
}

export function historyQuery({ query, cursor, groupId, after, before }: {
  query: string; cursor?: string; groupId?: string; after?: Date | null; before?: Date | null;
}) {
  if ((after && Number.isNaN(after.getTime())) || (before && Number.isNaN(before.getTime())))
    throw new Error("Choose a valid date range.");
  if (after && before && after > before) throw new Error("The start date must be before the end date.");
  const params = new URLSearchParams({ limit: "30" });
  if (query.trim()) params.set("q", query.trim());
  if (cursor) params.set("cursor", cursor);
  if (groupId) params.set("group_id", groupId);
  if (after) { const date = new Date(after); date.setHours(0, 0, 0, 0); params.set("updated_after", date.toISOString()); }
  if (before) { const date = new Date(before); date.setHours(23, 59, 59, 999); params.set("updated_before", date.toISOString()); }
  return `/v1/conversations?${params}`;
}
