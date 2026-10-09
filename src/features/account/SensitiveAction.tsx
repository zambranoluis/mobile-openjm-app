import { useEffect, useRef, useState } from "react";
import { api } from "../../platform/runtime";
import { Button, Feedback } from "../../ui/controls";
import { VerificationPanel } from "./VerificationPanel";
import { challenge } from "./securityModel";
import type { Challenge } from "./securityModel";
export type SensitiveActionName =
  | "ACCOUNT_EXPORT"
  | "ACCOUNT_DELETE"
  | "API_KEY_UPDATE"
  | "API_KEY_REVOKE"
  | "APP_INSTALLATION_SECRET_ROTATE"
  | "APP_INSTALLATION_DELETE"
  | "MEMORY_ITEM_DELETE"
  | "MEMORY_DELETE_ALL";
export function SensitiveAction({
  action,
  resourceId,
  label,
  perform,
  disabled = false,
}: {
  action: SensitiveActionName;
  resourceId?: string;
  label: string;
  perform: () => Promise<void>;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState<Challenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const revision = useRef<number | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function run(kind: "request" | "verify" | "resend", code?: string) {
    if (lock.current || disabled) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    const expected = api.session.revision();
    try {
      if (kind !== "request" && revision.current !== expected)
        throw new Error(
          "Your session changed. Request a new verification code.",
        );
      const result = await api.request(
        `/v1/me/security/sensitive-actions/${kind}`,
        {
          method: "POST",
          body: JSON.stringify(
            kind === "request"
              ? { action, ...(resourceId ? { resourceId } : {}) }
              : {
                  challengeId: pending?.challengeId,
                  ...(kind === "verify" ? { code } : {}),
                },
          ),
        },
      );
      if (!mounted.current) return;
      if (expected !== api.session.revision())
        throw new Error(
          "Your session changed. Request a new verification code.",
        );
      if (kind === "verify") {
        setPending(null);
        await perform();
      } else {
        setPending(challenge(result));
        revision.current = expected;
      }
    } catch (failure) {
      if (mounted.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "The action could not be confirmed.",
        );
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <>
      <Feedback message={error} />
      {pending ? (
        <VerificationPanel
          challenge={pending}
          busy={busy}
          verifyLabel={label}
          onVerify={(code) => void run("verify", code)}
          onResend={() => void run("resend")}
          onCancel={() => {
            setPending(null);
            setError(null);
          }}
        />
      ) : (
        <Button
          label={label}
          secondary
          busy={busy}
          disabled={disabled}
          onPress={() => void run("request")}
        />
      )}
    </>
  );
}
