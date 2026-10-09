import { useCallback, useEffect, useState } from "react";
import { AppState, Linking } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import { api } from "../../platform/runtime";
import {
  disableAlerts,
  permitsAlerts,
  registerAlerts,
} from "../../platform/notifications";
import { notificationStatus } from "../../platform/notificationModel";
import { Button, Copy, Feedback, Screen, Title } from "../../ui/controls";
export function AlertsScreen() {
  const [status, setStatus] = useState<{
    available: boolean;
    registered: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const state = notificationStatus(
        await api.request("/v1/notifications/status"),
      );
      if (
        state.registered &&
        !permitsAlerts(await Notifications.getPermissionsAsync())
      ) {
        await disableAlerts();
        state.registered = false;
      }
      setStatus(state);
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not refresh completion alerts.",
      );
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void load();
    });
    return () => listener.remove();
  }, [load]);
  async function toggle() {
    if (busy || !status?.available) return;
    setBusy(true);
    setError(null);
    try {
      if (status.registered) await disableAlerts();
      else await registerAlerts();
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not update completion alerts.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Title localize>Delivery settings</Title>
      <Copy>
        Choose “Notify me” on a running job to receive an alert when it finishes
        or fails. Alerts contain no conversation text.
      </Copy>
      <Copy muted>
        {status
          ? !status.available
            ? "Completion alerts are unavailable on this service."
            : status.registered
              ? "Alerts are enabled on this phone."
              : "Alerts are off on this phone."
          : "Checking availability…"}
      </Copy>
      <Feedback message={error} />
      <Button
        label={status?.registered ? "Turn off alerts" : "Enable alerts"}
        busy={busy}
        disabled={!status?.available}
        onPress={() => void toggle()}
      />
      <Button
        label="Open notification settings"
        secondary
        onPress={() =>
          void Linking.openSettings().catch(() =>
            setError("Phone settings could not open."),
          )
        }
      />
      <Button
        label="Refresh alert status"
        secondary
        disabled={busy}
        onPress={() => void load()}
      />
    </Screen>
  );
}
