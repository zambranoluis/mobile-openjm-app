import { useCallback, useState } from "react";
import { AppState } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Screen, Title } from "../../ui/controls";
import { useFeatureTask } from "../../ui/useFeatureTask";
import {
  appDefinition,
  asRecord,
  configuration,
  installation,
  installationSecret,
  resourceId,
} from "./appModel";
import type { AppDefinition } from "./appModel";
import { ConfigFields, configValues } from "./ConfigFields";
export function AppScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [app, setApp] = useState<AppDefinition | null>(null),
    [values, setValues] = useState<Record<string, string>>({});
  const [secret, setSecret] = useState<string | null>(null),
    [installedId, setInstalledId] = useState<string | null>(null);
  const { run, busy, error } = useFeatureTask();
  const load = useCallback(
    () =>
      run(
        async (signal) =>
          appDefinition(
            await api.request(`/v1/apps/${resourceId(id)}`, { signal }),
          ),
        (value) => {
          setApp(value);
          setValues(configValues(value.schema, {}));
        },
      ),
    [id, run],
  );
  useFocusEffect(
    useCallback(() => {
      setInstalledId(null);
      setSecret(null);
      void load().catch(() => {});
      const listener = AppState.addEventListener("change", (state) => {
        if (state !== "active") setSecret(null);
      });
      return () => {
        listener.remove();
        setSecret(null);
      };
    }, [load]),
  );
  async function install() {
    if (!app) return;
    await run(
      async (signal) => {
        const config = configuration(app.schema, values);
        return api.request(`/v1/apps/${app.id}/install`, {
          method: "POST",
          signal,
          body: JSON.stringify({ config }),
        });
      },
      (result) => {
        setInstalledId(installation(result).id);
        const raw = asRecord(result);
        if (
          (raw.installation_token || raw.installationToken) &&
          AppState.currentState === "active"
        )
          setSecret(installationSecret(result));
      },
    ).catch(() => {});
  }
  return (
    <Screen>
      <Title>{app?.name ?? "App details"}</Title>
      <Feedback message={error} />
      {app && (
        <>
          <Copy>{app.description}</Copy>
          <Copy muted>{app.capabilities.join(" · ")}</Copy>
          {installedId ? (
            <>
              <Copy>Installation confirmed by OpenJM.</Copy>
              {secret && (
                <>
                  <Copy>
                    Save this installation token securely. Leaving or
                    backgrounding this screen clears it.
                  </Copy>
                  <Copy>{secret}</Copy>
                  <Button
                    label="Dismiss installation token"
                    secondary
                    onPress={() => setSecret(null)}
                  />
                </>
              )}
              <Button
                label="Open installed app"
                onPress={() =>
                  router.replace({
                    pathname: "/installation/[id]",
                    params: { id: installedId },
                  })
                }
              />
            </>
          ) : (
            <>
              <ConfigFields
                schema={app.schema}
                values={values}
                onChange={setValues}
                disabled={busy}
              />
              <Button
                label={`Install ${app.name}`}
                busy={busy}
                onPress={() => void install()}
              />
            </>
          )}
        </>
      )}
      <Button
        label="Reload app details"
        secondary
        busy={busy}
        onPress={() => void load().catch(() => {})}
      />
    </Screen>
  );
}
