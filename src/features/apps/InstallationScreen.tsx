import { useCallback, useState } from "react";
import { Alert, AppState, Switch } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Screen, Title } from "../../ui/controls";
import { useFeatureTask } from "../../ui/useFeatureTask";
import { SensitiveAction } from "../account/SensitiveAction";
import {
  appDefinition,
  asRecord,
  asText,
  configuration,
  installation,
  installationSecret,
  resourceId,
} from "./appModel";
import type { AppDefinition, Installation } from "./appModel";
import { ConfigFields, configValues } from "./ConfigFields";
import { ObsidianPanel } from "./ObsidianPanel";
export function InstallationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Installation | null>(null),
    [app, setApp] = useState<AppDefinition | null>(null);
  const [values, setValues] = useState<Record<string, string>>({}),
    [enabled, setEnabled] = useState<boolean | null>(null);
  const [secret, setSecret] = useState<string | null>(null),
    [status, setStatus] = useState<string | null>(null);
  const [action, setAction] = useState<"rotate" | "delete" | null>(null);
  const task = useFeatureTask();
  const { run, busy, error } = task;
  const load = useCallback(
    () =>
      run(
        async (signal) => {
          const item = installation(
            await api.request(`/v1/apps/installations/${resourceId(id)}`, {
              signal,
            }),
          );
          const app = item.appId
            ? appDefinition(
                await api.request(`/v1/apps/${resourceId(item.appId)}`, {
                  signal,
                }),
              )
            : null;
          return { item, app };
        },
        (value) => {
          setItem(value.item);
          setApp(value.app);
          setEnabled(value.item.enabled);
          setValues(
            value.app ? configValues(value.app.schema, value.item.config) : {},
          );
        },
      ),
    [id, run],
  );
  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
      const listener = AppState.addEventListener("change", (state) => {
        if (state !== "active") setSecret(null);
      });
      return () => {
        listener.remove();
        setSecret(null);
        setAction(null);
      };
    }, [load]),
  );
  async function save() {
    if (!item) return;
    await run(
      async (signal) =>
        installation(
          await api.request(`/v1/apps/installations/${item.id}`, {
            method: "PATCH",
            signal,
            body: JSON.stringify({
              ...(enabled !== null ? { enabled } : {}),
              ...(app
                ? { config: configuration(app.schema, values, item.config) }
                : {}),
            }),
          }),
        ),
      (value) => {
        setItem(value);
        setEnabled(value.enabled);
        setStatus("Installation update confirmed by OpenJM.");
      },
    ).catch(() => {});
  }
  async function perform() {
    if (!item || !action) return;
    await run(
      (signal) =>
        api.request(
          `/v1/apps/installations/${item.id}${action === "rotate" ? "/rotate-secret" : ""}`,
          { method: action === "rotate" ? "POST" : "DELETE", signal },
        ),
      (value) => {
        if (action === "delete") router.back();
        else {
          setAction(null);
          if (AppState.currentState === "active")
            setSecret(installationSecret(value));
          else
            setStatus(
              "The token was rotated while backgrounded and discarded. Rotate it again if needed.",
            );
        }
      },
    );
  }
  return (
    <Screen>
      <Title>{app?.name ?? "Installed app"}</Title>
      <Feedback message={error} />
      {item && (
        <>
          <Copy>
            {[item.status, item.detail].filter(Boolean).join(" · ") ||
              "Status was not supplied."}
          </Copy>
          <Copy>Enable this installation</Copy>
          <Switch
            accessibilityLabel="Enable this installation"
            disabled={busy || enabled === null}
            value={enabled === true}
            onValueChange={setEnabled}
          />
          {enabled === null && (
            <Copy muted>
              Availability was not supplied; reload before changing it.
            </Copy>
          )}
          {app && (
            <ConfigFields
              schema={app.schema}
              values={values}
              onChange={setValues}
              disabled={busy}
            />
          )}
          <Button
            label="Save installation changes"
            busy={busy}
            disabled={!app && enabled === null}
            onPress={() => void save()}
          />
          <Button
            label="Read installation status"
            secondary
            busy={busy}
            onPress={() =>
              void run(
                async (signal) =>
                  asRecord(
                    await api.request(
                      `/v1/apps/installations/${item.id}/status`,
                      { signal },
                    ),
                  ),
                (value) =>
                  setStatus(
                    [
                      asText(value.status) ?? "Status unavailable",
                      asText(value.detail),
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  ),
              ).catch(() => {})
            }
          />
          {status && <Copy>{status}</Copy>}
          {secret && (
            <>
              <Copy>
                Store the new installation token securely. It clears when you
                leave or background the screen.
              </Copy>
              <Copy>{secret}</Copy>
              <Button
                label="Dismiss rotated token"
                secondary
                onPress={() => setSecret(null)}
              />
            </>
          )}
          {action ? (
            <SensitiveAction
              action={
                action === "rotate"
                  ? "APP_INSTALLATION_SECRET_ROTATE"
                  : "APP_INSTALLATION_DELETE"
              }
              resourceId={item.id}
              label={
                action === "rotate"
                  ? "Verify and rotate installation token"
                  : "Verify and remove installation"
              }
              disabled={busy}
              perform={perform}
            />
          ) : (
            <>
              <Button
                label="Rotate installation token"
                secondary
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "Rotate installation token?",
                    "Connected clients will need the replacement token.",
                    [
                      { text: "Keep token", style: "cancel" },
                      {
                        text: "Continue to verification",
                        onPress: () => setAction("rotate"),
                      },
                    ],
                  )
                }
              />
              <Button
                label="Remove installation"
                secondary
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "Remove this installation?",
                    "This disconnects the integration from OpenJM.",
                    [
                      { text: "Keep installation", style: "cancel" },
                      {
                        text: "Continue to verification",
                        style: "destructive",
                        onPress: () => setAction("delete"),
                      },
                    ],
                  )
                }
              />
            </>
          )}
          {item.appId === "obsidian" && (
            <ObsidianPanel key={item.id} id={item.id} task={task} />
          )}
        </>
      )}
      <Button
        label="Reload installation"
        secondary
        busy={busy}
        onPress={() => void load().catch(() => {})}
      />
    </Screen>
  );
}
