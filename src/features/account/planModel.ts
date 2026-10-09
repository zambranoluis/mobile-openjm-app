export type Plan = {
  tier: "free" | "regular" | "pro";
  name: string;
  priceCents: number | null;
  currency: string | null;
  interval: string | null;
  weeklyHours: number | null;
  description: string | null;
  current: boolean;
  purchasable: boolean;
  unavailableReason: string | null;
  features: string[];
};
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
export function planCatalog(value: unknown): Plan[] {
  const raw = record(value);
  if (!Array.isArray(raw.plans))
    throw new Error(
      "Plan choices could not be read. Refresh before purchasing.",
    );
  const seen = new Set<string>();
  return raw.plans.flatMap((value) => {
    const item = record(value);
    const tier = item.tier;
    if (
      (tier !== "free" && tier !== "regular" && tier !== "pro") ||
      seen.has(tier)
    )
      return [];
    seen.add(tier);
    const price = number(item.price_cents);
    const priceCents =
      price !== null && Number.isSafeInteger(price) ? price : null;
    const currency =
      typeof item.currency === "string" && /^[a-zA-Z]{3}$/.test(item.currency)
        ? item.currency.toUpperCase()
        : null;
    return [
      {
        tier,
        name: text(item.name) ?? tier,
        priceCents,
        currency,
        interval: text(item.interval),
        weeklyHours: number(item.weekly_hours),
        description: text(item.description),
        current: item.current === true,
        purchasable:
          tier !== "free" &&
          item.purchasable === true &&
          item.purchase_endpoint === "/v1/me/plan/purchase" &&
          priceCents !== null &&
          currency !== null,
        unavailableReason: text(item.unavailable_reason),
        features: Object.entries(record(item.features)).flatMap(
          ([key, value]) => {
            const label = key.replace(/[_-]+/g, " ");
            if (typeof value === "boolean")
              return [`${label}: ${value ? "included" : "not included"}`];
            if (
              typeof value === "string" ||
              (typeof value === "number" && Number.isFinite(value))
            )
              return [`${label}: ${value}`];
            return [];
          },
        ),
      } satisfies Plan,
    ];
  });
}
export function currentPlan(value: unknown) {
  const raw = record(value),
    nested = record(raw.plan);
  return {
    name:
      text(raw.name) ?? text(nested.name) ?? text(raw.tier) ?? text(raw.plan),
    status: text(raw.status) ?? text(raw.subscription_status),
    paidUntil: text(raw.paid_until),
    renewsAt: text(raw.renews_at),
  };
}
export function giftCardCode(value: string) {
  const code = value
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0")
    .replace(/[\s-]+/g, "");
  if (!/^[0-9A-HJKMNP-TV-Z]{12}$/.test(code))
    throw new Error("Enter the 12-character gift card code.");
  return code;
}
