import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { router } from "expo-router";
import { api } from "../../platform/runtime";
import type { LoginFlow } from "../../api/types";
import { loginFlow } from "../../api/types";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";
import { useAuth } from "./AuthProvider";

export function LoginScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [flow, setFlow] = useState<LoginFlow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const challenge = flow?.flow.nextStep === "OTP_REQUIRED";
  const totp = flow?.flow.nextStep === "UPSTREAM_TOTP_REQUIRED";
  const [now, setNow] = useState(() => Date.now());
  const resendAt = Date.parse(flow?.flow.challenge?.resendAvailableAt ?? "");
  const resendWait = Number.isFinite(resendAt)
    ? Math.max(0, Math.ceil((resendAt - now) / 1000))
    : 0;
  useEffect(() => {
    if (!challenge) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [challenge]);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const revision = api.session.revision();
    try {
      const result = challenge
        ? await api.request<LoginFlow>(
            "/v1/auth/verify-otp",
            {
              method: "POST",
              body: JSON.stringify({
                challengeId: flow?.flow.challenge?.challengeId,
                code,
              }),
            },
            false,
          )
        : await api.request<LoginFlow>(
            "/v1/auth/login",
            {
              method: "POST",
              body: JSON.stringify({
                email: email.trim(),
                password,
                ...(totp
                  ? {
                      mfaCode: code,
                      upstreamMfaChallenge: flow?.flow.upstreamMfaChallenge,
                    }
                  : {}),
              }),
            },
            false,
          );
      loginFlow(result);
      if (result.credentials) {
        await api.session.accept(result.credentials, revision);
        setPassword("");
        setCode("");
        setFlow(null);
        await auth.reload();
      } else if (
        ["OTP_REQUIRED", "UPSTREAM_TOTP_REQUIRED"].includes(
          result.flow.nextStep,
        )
      ) {
        setFlow(result);
        setCode("");
        if (result.flow.nextStep === "OTP_REQUIRED") setPassword("");
      } else
        throw new Error(
          "Sign-in did not establish a session. Please try again.",
        );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not sign in.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (busy || resendWait) return;
    setBusy(true);
    try {
      const next = await api.request<
        NonNullable<LoginFlow["flow"]["challenge"]>
      >(
        "/v1/auth/resend-otp",
        {
          method: "POST",
          body: JSON.stringify({
            challengeId: flow?.flow.challenge?.challengeId,
          }),
        },
        false,
      );
      setFlow((previous) =>
        previous
          ? { ...previous, flow: { ...previous.flow, challenge: next } }
          : null,
      );
      setNow(Date.now());
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not resend.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <Image
          source={require("../../../assets/hummingbird.png")}
          style={{ width: 88, height: 88 }}
          accessibilityLabel="OpenJM"
        />
      </View>
      <Title localize>Welcome to OpenJM</Title>
      <Copy muted>Your conversations, wherever you work.</Copy>
      {!api.configured ? (
        <Copy>
          Connect this private build to the OpenJM mobile service before signing
          in.
        </Copy>
      ) : null}
      {!challenge && !totp ? (
        <>
          <Field
            key="login-email"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!busy}
          />
          <Field
            key="login-password"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            editable={!busy}
          />
        </>
      ) : (
        <>
          <Copy>
            {challenge
              ? "Enter the verification code sent to your email."
              : "Enter the code from your authenticator."}
          </Copy>
          <Field
            key={`verification-${flow?.flow.challenge?.challengeId ?? "authenticator"}`}
            label="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={6}
            editable={!busy}
          />
        </>
      )}
      <Feedback
        message={
          error ??
          ((challenge || totp) && !auth.retrySignOut ? null : auth.error)
        }
      />
      {auth.retrySignOut && (
        <Button
          label="Retry sign-out"
          secondary
          busy={auth.signingOut}
          onPress={() => void auth.signOut()}
        />
      )}
      <Button
        label={challenge || totp ? "Verify and sign in" : "Sign in"}
        onPress={() => void submit()}
        busy={busy}
        disabled={
          !api.configured ||
          auth.signingOut ||
          (challenge || totp
            ? !/^\d{6}$/.test(code)
            : !email.trim() || !password)
        }
      />
      {challenge ? (
        <Button
          label={resendWait ? `Resend in ${resendWait}s` : "Resend code"}
          secondary
          disabled={busy || resendWait > 0}
          onPress={() => void resend()}
        />
      ) : null}
      {challenge || totp ? (
        <Button
          label="Back to sign in"
          secondary
          disabled={busy}
          onPress={() => {
            setFlow(null);
            setCode("");
            setPassword("");
            setError(null);
          }}
        />
      ) : (
        <>
          <Button
            label="Create an account"
            secondary
            onPress={() => router.push("/register")}
          />
          <Button
            label="Forgot password"
            secondary
            onPress={() => router.push("/recover")}
          />
          <Button
            label="Try anonymous chat"
            secondary
            onPress={() => router.push("/anonymous")}
          />
        </>
      )}
      <Button
        label="Legal documents"
        secondary
        onPress={() => router.push("/legal")}
      />
      <Button
        label="Interface language"
        secondary
        onPress={() => router.push("/language")}
      />
    </Screen>
  );
}
