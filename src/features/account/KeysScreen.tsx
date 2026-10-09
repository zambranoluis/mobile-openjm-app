import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Row, Screen, Title } from "../../ui/controls";
import { keyPage } from "./keyModel";
import type { ManagedKey } from "./keyModel";
import { KeyEditor } from "./KeyEditor";
export function KeysScreen() {
  const [keys, setKeys] = useState<ManagedKey[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null),
    [secret, setSecret] = useState<string | null>(null);
  const [editing, setEditing] = useState<ManagedKey | "new" | null>(null);
  const revision = useRef(0);
  const focused = useRef(false);
  const load = useCallback(
    async (next?: string) => {
      const expected = ++revision.current;
      setBusy(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          status: revoked ? "revoked" : "active",
          limit: "20",
          ...(next ? { cursor: next } : {}),
        });
        const page = keyPage(await api.request(`/v1/keys?${params}`), next);
        if (expected === revision.current) {
          setKeys((current) =>
            next
              ? [
                  ...new Map(
                    [...current, ...page.data].map((key) => [key.id, key]),
                  ).values(),
                ]
              : page.data,
          );
          setCursor(page.cursor);
        }
      } catch (failure) {
        if (expected === revision.current)
          setError(
            failure instanceof Error ? failure.message : "Could not load keys.",
          );
      } finally {
        if (expected === revision.current) setBusy(false);
      }
    },
    [revoked],
  );
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void load();
      return () => {
        focused.current = false;
        revision.current++;
        setSecret(null);
        setEditing(null);
      };
    }, [load]),
  );
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") setSecret(null);
    });
    return () => listener.remove();
  }, []);
  async function saved() {
    setEditing(null);
    await load();
  }
  return (
    <Screen>
      <Title localize>API keys</Title>
      <Feedback message={error} />
      {secret ? (
        <>
          <Copy>
            Store this key safely. It is shown once and stays only in memory
            until you leave or background this screen.
          </Copy>
          <Copy>{secret}</Copy>
          <Button
            label="Dismiss secret"
            secondary
            onPress={() => setSecret(null)}
          />
        </>
      ) : null}
      {editing ? (
        <KeyEditor
          key={editing === "new" ? "new" : editing.id}
          value={editing === "new" ? null : editing}
          onSaved={saved}
          onCreated={(value) => {
            if (focused.current && AppState.currentState === "active")
              setSecret(value);
            else
              setError(
                "A key was created while the app was backgrounded. Its secret was discarded; revoke it if you cannot retrieve it safely.",
              );
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          <Button
            label="Create API key"
            disabled={busy}
            onPress={() => setEditing("new")}
          />
          <Button
            label={revoked ? "Show active keys" : "Show revoked keys"}
            secondary
            disabled={busy}
            onPress={() => {
              setKeys([]);
              setCursor(null);
              setRevoked((value) => !value);
            }}
          />
          {keys.map((key) => (
            <Row
              key={key.id}
              title={key.prefix ?? "API key"}
              detail={[
                key.revoked === true
                  ? "Revoked"
                  : key.revoked === false
                    ? "Active"
                    : "Status unavailable",
                ...key.scopes,
                key.createdAt ? `Created ${key.createdAt}` : null,
                key.lastUsedAt ? `Last used ${key.lastUsedAt}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              onPress={
                key.revoked === false
                  ? () => {
                      setSecret(null);
                      setEditing(key);
                    }
                  : undefined
              }
            />
          ))}
          {!busy && !error && !keys.length && (
            <Copy muted>No keys were returned.</Copy>
          )}
          {cursor && (
            <Button
              label="Load more keys"
              secondary
              busy={busy}
              onPress={() => void load(cursor)}
            />
          )}
          <Button
            label="Refresh keys"
            secondary
            busy={busy}
            onPress={() => void load()}
          />
        </>
      )}
    </Screen>
  );
}
