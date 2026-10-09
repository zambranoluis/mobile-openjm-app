import { useState } from "react";
import { router } from "expo-router";
import { api } from "../../platform/runtime";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";

export function AccountAccessScreen({
  mode,
}: {
  mode: "register" | "recover";
}) {
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.request(
        mode === "register" ? "/v1/auth/register" : "/v1/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify(
            mode === "register"
              ? {
                  name,
                  lastname,
                  email: email.trim(),
                  phone: { areaCode, number },
                  password,
                }
              : { email: email.trim() },
          ),
        },
        false,
      );
      setDone(true);
      setPassword("");
      setConfirm("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not complete the request.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Title>
        {mode === "register" ? "Create your account" : "Recover access"}
      </Title>
      {done ? (
        <>
          <Copy>
            If the request is eligible, the next steps will be sent to your
            email.
          </Copy>
          <Button
            label="Back to sign in"
            onPress={() => router.replace("/login")}
          />
          {mode === "recover" && (
            <Button
              label="Use reset instructions"
              secondary
              onPress={() => router.push("/reset-password")}
            />
          )}
        </>
      ) : (
        <>
          {mode === "register" ? (
            <>
              <Field
                label="First name"
                value={name}
                onChangeText={setName}
                editable={!busy}
              />
              <Field
                label="Last name"
                value={lastname}
                onChangeText={setLastname}
                editable={!busy}
              />
            </>
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!busy}
          />
          {mode === "register" ? (
            <>
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
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                editable={!busy}
              />
              <Field
                label="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                editable={!busy}
              />
              <Copy muted>Use 8–24 printable characters without spaces.</Copy>
            </>
          ) : null}
          <Feedback message={error} />
          <Button
            label={
              mode === "register" ? "Create account" : "Send reset instructions"
            }
            busy={busy}
            disabled={
              !api.configured ||
              !email.trim() ||
              (mode === "register" &&
                (!name.trim() ||
                  !lastname.trim() ||
                  !areaCode ||
                  !number ||
                  !password ||
                  password !== confirm))
            }
            onPress={() => void submit()}
          />
          <Button
            label="Legal documents"
            secondary
            onPress={() => router.push("/legal")}
          />
          {mode === "recover" && (
            <Button
              label="I have reset instructions"
              secondary
              disabled={busy}
              onPress={() => router.push("/reset-password")}
            />
          )}
        </>
      )}
    </Screen>
  );
}
