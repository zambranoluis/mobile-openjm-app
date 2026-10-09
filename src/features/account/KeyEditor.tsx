import { useRef, useState } from "react";
import { Alert, Switch, View } from "react-native";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Field, Title } from "../../ui/controls";
import { color } from "../../ui/theme";
import { SensitiveAction } from "./SensitiveAction";
import { createdKey, keyInput, keyLimits, keyScopes } from "./keyModel";
import type { KeyLimit, ManagedKey } from "./keyModel";
const labels: Record<KeyLimit, string> = {
  rpm_limit: "Requests per minute",
  tpm_limit: "Tokens per minute",
  daily_token_limit: "Daily tokens",
  daily_spend_limit_cents: "Daily spending limit (cents)",
};
export function KeyEditor({
  value,
  onSaved,
  onCreated,
  onCancel,
}: {
  value: ManagedKey | null;
  onSaved: () => Promise<void>;
  onCreated: (secret: string) => void;
  onCancel: () => void;
}) {
  const [scopes, setScopes] = useState<string[]>(value?.scopes ?? []);
  const [limits, setLimits] = useState<Record<KeyLimit, string>>(
    () =>
      Object.fromEntries(
        keyLimits.map((key) => [
          key,
          value?.limits[key] != null ? String(value.limits[key]) : "",
        ]),
      ) as Record<KeyLimit, string>,
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [revoke, setRevoke] = useState(false);
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const input = keyInput(scopes, limits);
      const result = await api.request(
        value ? `/v1/keys/${encodeURIComponent(value.id)}` : "/v1/keys",
        { method: value ? "PATCH" : "POST", body: JSON.stringify(input) },
      );
      if (!value) onCreated(createdKey(result).secret);
      await onSaved();
    } catch (failure) {
      const error =
        failure instanceof Error
          ? failure
          : new Error("The key change could not be confirmed.");
      setError(error.message);
      throw error;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Title>{value ? "Key permissions and limits" : "Create API key"}</Title>
      <Copy muted>
        {value
          ? "Blank limits keep their current value."
          : "Choose the access this key needs. Blank limits use service defaults."}
      </Copy>
      {[...new Set([...keyScopes, ...scopes])].map((scope) => (
        <View
          key={scope}
          style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
        >
          <View style={{ flex: 1 }}>
            <Copy>{scope}</Copy>
          </View>
          <Switch
            accessibilityLabel={scope}
            disabled={busy}
            value={scopes.includes(scope)}
            trackColor={{ true: color.action }}
            onValueChange={(enabled) =>
              setScopes((current) =>
                enabled
                  ? [...current, scope]
                  : current.filter((value) => value !== scope),
              )
            }
          />
        </View>
      ))}
      {keyLimits.map((key) => (
        <Field
          key={key}
          label={labels[key]}
          keyboardType="number-pad"
          value={limits[key]}
          onChangeText={(text) =>
            setLimits((current) => ({ ...current, [key]: text }))
          }
          editable={!busy}
        />
      ))}
      <Feedback message={error} />
      {value ? (
        <SensitiveAction
          action="API_KEY_UPDATE"
          resourceId={value.id}
          label="Verify and save key changes"
          disabled={busy}
          perform={save}
        />
      ) : (
        <Button
          label="Create selected API key"
          busy={busy}
          disabled={!scopes.length}
          onPress={() => void save().catch(() => {})}
        />
      )}
      {value && !revoke && (
        <Button
          label="Revoke key"
          secondary
          disabled={busy}
          onPress={() =>
            Alert.alert(
              "Revoke this API key?",
              "Applications using this key will lose access.",
              [
                { text: "Keep key", style: "cancel" },
                {
                  text: "Continue to verification",
                  style: "destructive",
                  onPress: () => setRevoke(true),
                },
              ],
            )
          }
        />
      )}
      {value && revoke && (
        <SensitiveAction
          action="API_KEY_REVOKE"
          resourceId={value.id}
          label="Verify and revoke key"
          disabled={busy}
          perform={async () => {
            await api.request(
              `/v1/keys/${encodeURIComponent(value.id)}/revoke`,
              { method: "POST" },
            );
            await onSaved();
          }}
        />
      )}
      <Button
        label="Close key editor"
        secondary
        disabled={busy}
        onPress={onCancel}
      />
    </>
  );
}
