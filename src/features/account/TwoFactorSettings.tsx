import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Title } from "../../ui/controls";
import { useAuth } from "../auth/AuthProvider";
import { challenge, twoFactorStatus } from "./securityModel";
import type { Challenge } from "./securityModel";
import { VerificationPanel } from "./VerificationPanel";
export function TwoFactorSettings() {
  const { reload } = useAuth();
  const [status, setStatus] = useState<ReturnType<
    typeof twoFactorStatus
  > | null>(null);
  const [pending, setPending] = useState<{
    action: "enable" | "disable";
    challenge: Challenge;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setStatus(twoFactorStatus(await api.request("/v1/me/2fa")));
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not refresh security.",
      );
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function request(action: "enable" | "disable") {
    if (busy || status?.managedByUpstream) return;
    setBusy(true);
    setError(null);
    try {
      setPending({
        action,
        challenge: challenge(
          await api.request(`/v1/me/2fa/${action}/request`, { method: "POST" }),
        ),
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Verification could not start.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify(code: string) {
    if (busy || !pending) return;
    setBusy(true);
    setError(null);
    try {
      setStatus(
        twoFactorStatus(
          await api.request(`/v1/me/2fa/${pending.action}/verify`, {
            method: "POST",
            body: JSON.stringify({
              challengeId: pending.challenge.challengeId,
              code,
            }),
          }),
        ),
      );
      setPending(null);
      await reload();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Security change could not be confirmed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Title localize>Two-factor authentication</Title>
      <Feedback message={error} />
      <Copy>
        {status
          ? status.enabled
            ? `Enabled${status.method ? ` · ${status.method}` : ""}`
            : "Not enabled"
          : "Loading security…"}
      </Copy>
      {status?.managedByUpstream ? (
        <Copy muted>
          Your authenticator setting is managed by your OpenJM account.
        </Copy>
      ) : pending ? (
        <VerificationPanel
          key={pending.challenge.challengeId}
          challenge={pending.challenge}
          busy={busy}
          onVerify={(code) => void verify(code)}
          onResend={() => void request(pending.action)}
          onCancel={() => setPending(null)}
        />
      ) : (
        <Button
          label={
            status?.enabled
              ? "Turn off two-factor authentication"
              : "Enable two-factor authentication"
          }
          secondary
          busy={busy}
          disabled={!status}
          onPress={() => {
            if (status?.enabled)
              Alert.alert(
                "Turn off two-factor authentication?",
                "A verification code is required to confirm this change.",
                [
                  { text: "Keep enabled", style: "cancel" },
                  { text: "Continue", onPress: () => void request("disable") },
                ],
              );
            else void request("enable");
          }}
        />
      )}
    </>
  );
}
