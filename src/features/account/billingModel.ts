function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function number(value: Record<string, unknown>, keys: string[]) {
  for (const key of keys)
    if (typeof value[key] === "number" && Number.isFinite(value[key]))
      return value[key] as number;
  return null;
}
export function balance(value: unknown) {
  const raw = record(value);
  const source = raw.summary ? record(raw.summary) : raw;
  return {
    cents: number(source, [
      "balance_cents",
      "balanceCents",
      "available_cents",
      "credits_cents",
    ]),
    credits: number(source, [
      "available_credits",
      "credit_balance",
      "balance_credits",
      "credits",
    ]),
    currency: typeof source.currency === "string" ? source.currency : null,
  };
}
export function checkoutUrl(value: unknown) {
  const raw = record(value);
  const candidate = raw.checkout_url ?? raw.checkoutUrl ?? raw.url;
  if (typeof candidate !== "string")
    throw new Error(
      "Checkout did not provide a destination. Refresh billing before trying again.",
    );
  const url = new URL(candidate);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Checkout returned an unsafe destination.");
  return url.toString();
}
export function amountInCents(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim()))
    throw new Error("Enter a positive amount with up to two decimal places.");
  const [units, fractional = ""] = value.trim().split(".");
  const amount = Number(units) * 100 + Number(fractional.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2_147_483_647)
    throw new Error("Enter a valid positive amount.");
  return amount;
}
