import { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AppState } from "react-native";
import { reconcileAlerts } from "../../platform/notifications";
import { NotificationInbox } from "../../platform/notificationModel";
import { useAuth } from "./AuthProvider";
const inbox = new NotificationInbox(AsyncStorage);
export function NotificationLinks() {
  const { profile, loading } = useAuth();
  const current = useRef(profile);
  useEffect(() => {
    current.current = profile;
  }, [profile]);
  const openPending = useCallback(async () => {
    const user = current.current;
    if (!user?.profileComplete) return;
    const target = await inbox.consume(user.id);
    if (
      target &&
      current.current?.id === user.id &&
      current.current.profileComplete
    ) {
      if (target.resourceType && target.resourceType !== "response")
        router.push({
          pathname: "/media/[kind]/[id]",
          params: { kind: target.resourceType, id: target.jobId },
        });
      else router.push({ pathname: "/job/[id]", params: { id: target.jobId } });
    }
  }, []);
  useEffect(() => {
    const accept = async (response: Notifications.NotificationResponse) => {
      await inbox.offer(response.notification.request.content.data);
      await Notifications.clearLastNotificationResponseAsync().catch(() => {});
      await openPending();
    };
    const listener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void accept(response).catch(() => {});
      },
    );
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) void accept(response).catch(() => {});
      })
      .catch(() => {});
    return () => listener.remove();
  }, [openPending]);
  useEffect(() => {
    if (!loading) void openPending().catch(() => {});
  }, [profile?.id, profile?.profileComplete, loading, openPending]);
  useEffect(() => {
    if (!profile?.profileComplete) return;
    const reconcile = () => {
      void reconcileAlerts().catch(() => {});
    };
    reconcile();
    const lifecycle = AppState.addEventListener("change", (state) => {
      if (state === "active") reconcile();
    });
    const tokens = Notifications.addPushTokenListener(reconcile);
    return () => {
      lifecycle.remove();
      tokens.remove();
    };
  }, [profile?.id, profile?.profileComplete]);
  return null;
}
