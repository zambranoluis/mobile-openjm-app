import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./runtime";
import { notificationProject, notificationStatus } from "./notificationModel";
export function permitsAlerts(
  permission: Notifications.NotificationPermissionsStatus,
) {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}
let generation = 0;
let operations: Promise<unknown> = Promise.resolve();
function serial(work: () => Promise<void>) {
  const result = operations.then(work, work);
  operations = result.catch(() => {});
  return result;
}
export function registerAlerts() {
  const expected = ++generation;
  return serial(() => register(expected));
}
export function disableAlerts() {
  generation++;
  return serial(async () => {
    await api.request("/v1/notifications/device", { method: "DELETE" });
  });
}
async function register(expected: number) {
  const revision = api.session.revision();
  if (Platform.OS !== "android" && Platform.OS !== "ios")
    throw new Error("Completion alerts require the installed phone app.");
  const projectId = notificationProject(
    Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId,
  );
  if (!projectId)
    throw new Error("Completion alerts are not available in this build yet.");
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("completion", {
      name: "Completion alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  let permission = await Notifications.getPermissionsAsync();
  if (!permitsAlerts(permission))
    permission = await Notifications.requestPermissionsAsync();
  if (!permitsAlerts(permission))
    throw new Error(
      "Notifications are disabled. You can enable them in your phone settings.",
    );
  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId }))
    .data;
  if (
    expected !== generation ||
    revision !== api.session.revision() ||
    !api.session.snapshot()
  )
    return;
  await api.request("/v1/notifications/device", {
    method: "POST",
    body: JSON.stringify({ pushToken, platform: Platform.OS }),
  });
}
let pending: Promise<void> | null = null;
/** Refresh an existing opt-in only; foreground reconciliation never requests permission. */
export async function reconcileAlerts() {
  if (pending) return pending;
  const expected = generation;
  const work = serial(async () => {
    const revision = api.session.revision();
    if (
      !api.session.snapshot() ||
      (Platform.OS !== "android" && Platform.OS !== "ios")
    )
      return;
    const status = notificationStatus(
      await api.request("/v1/notifications/status"),
    );
    if (
      !status.available ||
      !status.registered ||
      expected !== generation ||
      revision !== api.session.revision()
    )
      return;
    if (!permitsAlerts(await Notifications.getPermissionsAsync())) {
      if (expected === generation && revision === api.session.revision())
        await api.request("/v1/notifications/device", { method: "DELETE" });
      return;
    }
    const projectId = notificationProject(
      Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.eas?.projectId,
    );
    if (!projectId) return;
    const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    if (
      expected === generation &&
      revision === api.session.revision() &&
      api.session.snapshot()
    )
      await api.request("/v1/notifications/device", {
        method: "POST",
        body: JSON.stringify({ pushToken, platform: Platform.OS }),
      });
  });
  pending = work;
  try {
    await work;
  } finally {
    if (pending === work) pending = null;
  }
}
