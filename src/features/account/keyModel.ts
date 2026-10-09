export const keyScopes = [
  "chat:write",
  "usage:read",
  "memory:read",
  "memory:write",
  "apps:read",
  "apps:write",
] as const;
export const keyLimits = [
  "rpm_limit",
  "tpm_limit",
  "daily_token_limit",
  "daily_spend_limit_cents",
] as const;
export type KeyLimit = (typeof keyLimits)[number];
export type ManagedKey = {
  id: string;
  prefix: string | null;
  scopes: string[];
  revoked: boolean | null;
  createdAt: string | null;
  lastUsedAt: string | null;
  limits: Record<KeyLimit, number | null>;
};
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
export function managedKey(value: unknown): ManagedKey {
  const raw = record(value);
  const id = text(raw.id);
  if (
    !id ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(id) ||
    !Array.isArray(raw.scopes) ||
    raw.scopes.some((scope) => typeof scope !== "string")
  )
    throw new Error("API key details could not be used.");
  const limits = Object.fromEntries(
    keyLimits.map((key) => [
      key,
      typeof raw[key] === "number" &&
      Number.isSafeInteger(raw[key]) &&
      (raw[key] as number) > 0
        ? raw[key]
        : null,
    ]),
  ) as ManagedKey["limits"];
  return {
    id,
    prefix: text(raw.key_prefix),
    scopes: raw.scopes as string[],
    revoked: typeof raw.is_revoked === "boolean" ? raw.is_revoked : null,
    createdAt: text(raw.created_at),
    lastUsedAt: text(raw.last_used_at),
    limits,
  };
}
export function keyPage(value: unknown, previousCursor?: string) {
  const raw = record(value);
  if (!Array.isArray(raw.data) || typeof raw.has_more !== "boolean")
    throw new Error("API key history could not be read.");
  const cursor = text(raw.next_cursor);
  if (raw.has_more && (!cursor || cursor === previousCursor))
    throw new Error("API key pagination could not be used.");
  return {
    data: raw.data.map(managedKey),
    cursor: raw.has_more ? cursor : null,
  };
}
export function keyInput(scopes: string[], limits: Record<KeyLimit, string>) {
  if (
    !scopes.length ||
    scopes.length > 32 ||
    scopes.some(
      (value) =>
        !value.trim() || value.length > 128 || /[\u0000-\u001f]/.test(value),
    )
  )
    throw new Error("Select at least one valid API key permission.");
  const result: { scopes: string[] } & Partial<Record<KeyLimit, number>> = {
    scopes: [...new Set(scopes)],
  };
  for (const key of keyLimits) {
    const value = limits[key].trim();
    if (!value) continue;
    if (
      !/^\d{1,10}$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) < 1 ||
      Number(value) > 2147483647
    )
      throw new Error("API key limits must be positive whole numbers.");
    result[key] = Number(value);
  }
  return result;
}
export function createdKey(value: unknown) {
  const raw = record(value),
    secret = text(raw.api_key);
  if (!secret || secret.length > 4096)
    throw new Error(
      "The created key could not be displayed. Check your key list before creating another.",
    );
  return { key: managedKey(value), secret };
}
