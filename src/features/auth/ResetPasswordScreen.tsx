import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../../platform/runtime";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";
import { resetToken } from "./resetModel";
export function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(() => resetToken(params.token) ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (params.token) router.setParams({ token: undefined });
  }, [params.token]);
  async function submit() {
    const value = resetToken(token);
    if (busy || !value || !password || password !== confirm) return;
    setBusy(true);
    setError(null);
    try {
      await api.request(
        "/v1/auth/reset-password",
        { method: "POST", body: JSON.stringify({ token: value, password }) },
        false,
      );
      setDone(true);
      setToken("");
      setPassword("");
      setConfirm("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your password could not be reset. Request fresh instructions and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Title localize>Reset your password</Title>
      {done ? (
        <>
          <Copy>Your password was reset. Sign in with your new password.</Copy>
          <Button
            label="Back to sign in"
            onPress={() => router.replace("/login")}
          />
        </>
      ) : (
        <>
          <Copy>
            Paste the reset link or token from your email. It is used only for
            this password reset.
          </Copy>
          <Field
            label="Reset link or token"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            maxLength={8192}
            editable={!busy}
          />
          <Field
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            editable={!busy}
          />
          <Field
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            editable={!busy}
          />
          <Copy muted>Use 8–24 printable characters without spaces.</Copy>
          <Feedback message={error} />
          <Button
            label="Reset password"
            busy={busy}
            disabled={
              !api.configured ||
              !resetToken(token) ||
              !password ||
              password !== confirm
            }
            onPress={() => void submit()}
          />
          <Button
            label="Request fresh instructions"
            secondary
            disabled={busy}
            onPress={() => router.replace("/recover")}
          />
        </>
      )}
    </Screen>
  );
}
