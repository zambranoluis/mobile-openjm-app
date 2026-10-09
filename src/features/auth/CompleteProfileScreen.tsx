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
import { useAuth } from "./AuthProvider";

export function CompleteProfileScreen() {
  const auth = useAuth();
  const [name, setName] = useState(auth.profile?.name ?? "");
  const [lastname, setLastname] = useState(auth.profile?.lastname ?? "");
  const [country, setCountry] = useState("");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setBusy(true);
    try {
      await api.request("/v1/me/complete-profile", {
        method: "POST",
        body: JSON.stringify({
          name,
          lastname,
          phone: { areaCode: country, number },
        }),
      });
      await auth.reload();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not complete profile.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Title localize>Complete your profile</Title>
      <Copy muted>Confirm your details to continue.</Copy>
      <Field label="First name" value={name} onChangeText={setName} />
      <Field label="Last name" value={lastname} onChangeText={setLastname} />
      <Field
        label="Country calling code"
        value={country}
        onChangeText={setCountry}
        keyboardType="phone-pad"
      />
      <Field
        label="Phone number"
        value={number}
        onChangeText={setNumber}
        keyboardType="phone-pad"
      />
      <Feedback message={error} />
      <Button
        label="Continue"
        busy={busy}
        disabled={!name.trim() || !lastname.trim() || !number || !country}
        onPress={() => void save()}
      />
      <Button label="Sign out" secondary onPress={() => void auth.signOut()} />
    </Screen>
  );
}
