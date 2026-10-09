import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Row, Screen, Title } from "../../ui/controls";
import { appDefinition, collection, installation } from "./appModel";
import type { AppDefinition, Installation } from "./appModel";
import { useFeatureTask } from "../../ui/useFeatureTask";
export function AppsScreen() {
  const [apps, setApps] = useState<AppDefinition[]>([]);
  const [installed, setInstalled] = useState<Installation[]>([]);
  const { run, busy, error } = useFeatureTask();
  const load = useCallback(async () => {
    await run(
      async (signal) => {
        const [catalog, installs] = await Promise.all([
          api.request("/v1/apps", { signal }),
          api.request("/v1/apps/installations", { signal }),
        ]);
        return {
          apps: collection(catalog).map(appDefinition),
          installed: collection(installs).map(installation),
        };
      },
      (value) => {
        setApps(value.apps);
        setInstalled(value.installed);
      },
    ).catch(() => {});
  }, [run]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <Screen>
      <Title localize>Apps</Title>
      <Copy muted>Connect your OpenJM workspace to the tools you use.</Copy>
      <Feedback message={error} />
      {apps.map((app) => (
        <Row
          key={app.id}
          title={app.name}
          detail={app.description ?? undefined}
          onPress={() =>
            router.push({ pathname: "/app/[id]", params: { id: app.id } })
          }
        />
      ))}
      {!apps.length && !busy && !error ? (
        <Copy muted>No apps are currently available.</Copy>
      ) : null}
      <Title localize>Installed apps</Title>
      {installed.map((item) => (
        <Row
          key={item.id}
          title={item.appId ?? "Installed app"}
          detail={[
            item.status,
            item.enabled === true
              ? "Enabled"
              : item.enabled === false
                ? "Disabled"
                : "Availability unknown",
            item.detail,
          ]
            .filter(Boolean)
            .join(" · ")}
          onPress={() =>
            router.push({
              pathname: "/installation/[id]",
              params: { id: item.id },
            })
          }
        />
      ))}
      {!installed.length && !busy && !error && (
        <Copy muted>No installations were returned.</Copy>
      )}
      <Button
        label="Refresh apps"
        secondary
        busy={busy}
        onPress={() => void load()}
      />
    </Screen>
  );
}
