type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}
function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function usageSummary(value: unknown) {
  const raw = record(value);
  const data = Array.isArray(raw.data)
    ? raw.data
    : Array.isArray(raw.items)
      ? raw.items
      : [];
  return {
    requests: number(raw.total_requests),
    tokens: number(raw.total_tokens),
    costCents: number(raw.total_cost_cents) ?? number(raw.cost_cents),
    currency: typeof raw.currency === "string" ? raw.currency : null,
    entries: data.map((item, index) => {
      const row = record(item);
      return {
        id: String(index),
        label:
          typeof row.model === "string"
            ? row.model
            : typeof row.label === "string"
              ? row.label
              : typeof row.day === "string"
                ? row.day
                : "Usage entry",
        requests: number(row.total_requests) ?? number(row.requests),
        tokens: number(row.total_tokens),
      };
    }),
  };
}
