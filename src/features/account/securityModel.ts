export type Challenge = {
  challengeId: string;
  destinationHint: string;
  expiresAt: string;
  resendAvailableAt: string;
};
export function challenge(value: unknown): Challenge {
  if (!value || typeof value !== "object")
    throw new Error("Verification challenge could not be used.");
  const data = value as Record<string, unknown>;
  if (
    typeof data.challengeId !== "string" ||
    !data.challengeId ||
    typeof data.destinationHint !== "string" ||
    typeof data.expiresAt !== "string" ||
    !Number.isFinite(Date.parse(data.expiresAt)) ||
    typeof data.resendAvailableAt !== "string" ||
    !Number.isFinite(Date.parse(data.resendAvailableAt))
  )
    throw new Error("Verification challenge could not be used.");
  return data as Challenge;
}
export function twoFactorStatus(value: unknown): {
  enabled: boolean;
  managedByUpstream: boolean;
  method: string | null;
} {
  if (!value || typeof value !== "object")
    throw new Error("Security status could not be used.");
  const data = value as Record<string, unknown>;
  if (
    typeof data.enabled !== "boolean" ||
    typeof data.managedByUpstream !== "boolean" ||
    (data.method !== null && typeof data.method !== "string")
  )
    throw new Error("Security status could not be used.");
  return {
    enabled: data.enabled,
    managedByUpstream: data.managedByUpstream,
    method: data.method,
  };
}
