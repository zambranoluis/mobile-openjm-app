export type UsageEvent = {
  id: string;
  at: string;
  model: string;
  kind: string | null;
  tokens: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  costCents: number | null;
  tier: string | null;
  source: string | null;
  finish: string | null;
  latency: number | null;
  conversationId: string | null;
};
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
export function usageWindow(from: string, to: string) {
  const start = Date.parse(from),
    end = Date.parse(to);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end)
    throw new Error(
      "Enter a valid start and end date, with the start before the end.",
    );
  return {
    from: new Date(start).toISOString(),
    to: new Date(end).toISOString(),
  };
}
export function usageDetails(value: unknown, offset: number) {
  if (!value || typeof value !== "object")
    throw new Error("Usage details could not be read.");
  const raw = value as Record<string, unknown>;
  if (
    !Array.isArray(raw.data) ||
    typeof raw.has_more !== "boolean" ||
    !Number.isSafeInteger(raw.next_offset) ||
    (raw.next_offset as number) < offset ||
    (raw.has_more && (raw.next_offset as number) <= offset)
  )
    throw new Error("Usage pagination could not be used. Refresh the view.");
  const seen = new Set<string>();
  const data: UsageEvent[] = raw.data.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const event = value as Record<string, unknown>;
    const id = text(event.id),
      at = text(event.created_at),
      model = text(event.model);
    if (
      !id ||
      !at ||
      !Number.isFinite(Date.parse(at)) ||
      !model ||
      seen.has(id)
    )
      return [];
    seen.add(id);
    return [
      {
        id,
        at,
        model,
        kind: text(event.kind),
        tier: text(event.tier),
        tokens: number(event.total_tokens),
        promptTokens: number(event.prompt_tokens),
        completionTokens: number(event.completion_tokens),
        costCents: number(event.cost_cents),
        source: text(event.token_source),
        finish: text(event.finish_reason),
        latency: number(event.latency_ms),
        conversationId: text(event.conversation_id),
      },
    ];
  });
  return {
    data,
    nextOffset: raw.has_more ? (raw.next_offset as number) : null,
    partial: raw.is_partial === true,
  };
}
