import { useState } from "react";
import { api } from "../../platform/runtime";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";
import { useAuth } from "../auth/AuthProvider";
import { challenge } from "./securityModel";
import type { Challenge } from "./securityModel";
import { VerificationPanel } from "./VerificationPanel";
import { TwoFactorSettings } from "./TwoFactorSettings";
import { router } from "expo-router";
export function ProfileScreen() {
  const { profile, reload } = useAuth();
  const [name, setName] = useState(profile?.name ?? ""),
    [lastname, setLastname] = useState(profile?.lastname ?? "");
  const [areaCode, setAreaCode] = useState(profile?.phone?.areaCode ?? ""),
    [number, setNumber] = useState(profile?.phone?.number ?? "");
  const [pending, setPending] = useState<Challenge | null>(null);
  const [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function change(path: string, method: string, body: unknown) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const flow = await api.request<{
        nextStep?: string;
        challenge?: unknown;
      }>(path, { method, body: JSON.stringify(body) });
      if (flow.nextStep === "OTP_REQUIRED")
        setPending(challenge(flow.challenge));
      else if (flow.nextStep === "UPDATED") {
        await reload();
        setPending(null);
        setSaved(true);
      } else throw new Error("Profile change response could not be used.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Profile change could not be confirmed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (busy || !pending) return;
    setBusy(true);
    setError(null);
    try {
      setPending(
        challenge(
          await api.request("/v1/me/profile/resend-otp", {
            method: "POST",
            body: JSON.stringify({ challengeId: pending.challengeId }),
          }),
        ),
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not send another verification code.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Title localize>Your details</Title>
      <Copy muted>{profile?.email}</Copy>
      <Feedback message={error} />
      {saved && <Copy>Profile updated.</Copy>}
      {pending ? (
        <VerificationPanel
          key={pending.challengeId}
          challenge={pending}
          busy={busy}
          onVerify={(code) =>
            void change("/v1/me/profile/verify-otp", "POST", {
              challengeId: pending.challengeId,
              code,
            })
          }
          onResend={() => void resend()}
          onCancel={() => setPending(null)}
        />
      ) : (
        <>
          <Field
            label="First name"
            value={name}
            onChangeText={setName}
            maxLength={100}
            editable={!busy}
          />
          <Field
            label="Last name"
            value={lastname}
            onChangeText={setLastname}
            maxLength={100}
            editable={!busy}
          />
          <Field
            label="Country calling code"
            value={areaCode}
            onChangeText={setAreaCode}
            keyboardType="phone-pad"
            editable={!busy}
          />
          <Field
            label="Phone number"
            value={number}
            onChangeText={setNumber}
            keyboardType="phone-pad"
            editable={!busy}
          />
          <Button
            label="Save profile"
            busy={busy}
            disabled={!name.trim() || !lastname.trim() || !areaCode || !number}
            onPress={() =>
              void change("/v1/me", "PUT", {
                name: name.trim(),
                lastname: lastname.trim(),
                phone: { areaCode, number },
              })
            }
          />
        </>
      )}
      <TwoFactorSettings />
      <Button
        label="Profile photo"
        secondary
        onPress={() => router.push("/account/photo")}
      />
      <Button
        label="Delete account"
        secondary
        onPress={() => router.push("/account/delete")}
      />
    </Screen>
  );
}
