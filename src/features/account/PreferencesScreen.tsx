import { useCallback, useRef, useState } from "react";
import { Switch, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";
import { color } from "../../ui/theme";
import { preferences } from "./preferenceModel";
import type { Preferences } from "./preferenceModel";
export function PreferencesScreen() {
  const [value, setValue] = useState<Preferences | null>(null);
  const [maximum, setMaximum] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const lock = useRef(false),
    revision = useRef(0);
  const load = useCallback(async () => {
    const expected = ++revision.current;
    setBusy(true);
    try {
      const next = preferences(await api.request("/v1/me/memory-preferences"));
      if (expected === revision.current) {
        setValue(next);
        setMaximum(String(next.max_items));
        setError(null);
      }
    } catch (failure) {
      if (expected === revision.current) {
        setValue(null);
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not load preferences.",
        );
      }
    } finally {
      if (expected === revision.current) setBusy(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        revision.current++;
      };
    }, [load]),
  );
  async function save() {
    if (!value || busy || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (
        !/^\d{1,2}$/.test(maximum) ||
        Number(maximum) < 1 ||
        Number(maximum) > 50
      )
        throw new Error("Choose between 1 and 50 related memories.");
      const result = preferences(
        await api.request("/v1/me/memory-preferences", {
          method: "PATCH",
          body: JSON.stringify({
            ...value,
            max_items: Number(maximum),
            form: value.enabled && value.form,
          }),
        }),
      );
      setValue(result);
      setMaximum(String(result.max_items));
      setNotice("Preferences saved to your account.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Preferences could not be saved.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function toggle(
    key: "enabled" | "form" | "web_search_enabled",
    label: string,
    detail: string,
  ) {
    if (!value) return null;
    return (
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Copy>{label}</Copy>
          </View>
          <Switch
            accessibilityLabel={label}
            value={value[key]}
            disabled={busy || (key === "form" && !value.enabled)}
            trackColor={{ true: color.action }}
            onValueChange={(next) =>
              setValue((current) =>
                current
                  ? {
                      ...current,
                      [key]: next,
                      ...(key === "enabled" && !next ? { form: false } : {}),
                    }
                  : null,
              )
            }
          />
        </View>
        <Copy muted>{detail}</Copy>
      </View>
    );
  }
  return (
    <Screen>
      <Title localize>Conversation preferences</Title>
      <Feedback message={error} />
      {notice && <Copy>{notice}</Copy>}
      {toggle(
        "enabled",
        "Use related memories",
        "Include relevant saved memories in future conversations.",
      )}
      {value && (
        <Field
          label="Maximum related memories"
          keyboardType="number-pad"
          value={maximum}
          onChangeText={setMaximum}
          editable={!busy && value.enabled}
          maxLength={2}
        />
      )}
      {toggle(
        "form",
        "Create new memories",
        "Create durable memories from conversations for future chats.",
      )}
      {toggle(
        "web_search_enabled",
        "Web search",
        "Use web search when the selected model supports it.",
      )}
      <Button
        label="Save preferences"
        busy={busy}
        disabled={!value}
        onPress={() => void save()}
      />
      <Button
        label="Reload saved preferences"
        secondary
        disabled={busy}
        onPress={() => void load()}
      />
    </Screen>
  );
}
