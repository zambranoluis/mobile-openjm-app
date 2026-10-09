export function domainInput(value: string) {
  const domain = value.trim().toLowerCase();
  const labels = domain.split(".");
  if (
    domain.length > 253 ||
    labels.length < 2 ||
    labels.some(
      (label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
    )
  )
    throw new Error(
      "Enter a domain name without a URL or path. International names use their ASCII (punycode) form.",
    );
  return domain;
}
export type DomainState = {
  domain: string;
  challengeId: string;
  status: "pending" | "verified";
  name: string | null;
  type: string | null;
  value: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
};
export function domainState(payload: unknown): DomainState {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("Domain verification details could not be read.");
  const raw = payload as Record<string, unknown>;
  const text = (key: string) =>
    typeof raw[key] === "string" && (raw[key] as string).trim()
      ? (raw[key] as string).trim()
      : null;
  const domain = text("domain"),
    challengeId = text("challenge_id");
  if (
    !domain ||
    !challengeId ||
    (raw.status !== "pending" && raw.status !== "verified")
  )
    throw new Error("Domain verification state could not be confirmed.");
  return {
    domain: domainInput(domain),
    challengeId,
    status: raw.status,
    name: text("dns_record_name"),
    type: text("dns_record_type"),
    value: text("dns_record_value"),
    expiresAt: text("expires_at"),
    verifiedAt: text("verified_at"),
  };
}
