export type Preferences = {
  enabled: boolean;
  max_items: number;
  form: boolean;
  web_search_enabled: boolean;
};
export function preferences(value: unknown): Preferences {
  if (!value || typeof value !== "object")
    throw new Error("Preferences could not be loaded.");
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.enabled !== "boolean" ||
    typeof raw.form !== "boolean" ||
    typeof raw.web_search_enabled !== "boolean" ||
    typeof raw.max_items !== "number" ||
    !Number.isInteger(raw.max_items) ||
    raw.max_items < 1 ||
    raw.max_items > 50
  )
    throw new Error("Preferences could not be used. Refresh before saving.");
  return {
    enabled: raw.enabled,
    form: raw.form,
    web_search_enabled: raw.web_search_enabled,
    max_items: raw.max_items,
  };
}
