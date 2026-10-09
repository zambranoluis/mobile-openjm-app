import { Stack } from "expo-router";
import { useEffect } from "react";
import { initializeLanguage, useLanguage } from "../src/platform/language";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "../src/features/auth/AuthProvider";
import { color } from "../src/ui/theme";
import { NotificationLinks } from "../src/features/auth/NotificationLinks";
function Routes() {
  const { t } = useLanguage();
  const { profile, loading } = useAuth();
  if (loading)
    return (
      <ActivityIndicator
        style={{ flex: 1, backgroundColor: color.canvas }}
        color={color.action}
        accessibilityLabel="Restoring session"
      />
    );
  return (
    <>
      <StatusBar style="light" />
      <NotificationLinks />
      <Stack
        key={profile?.id ?? "guest"}
        screenOptions={{
          headerStyle: { backgroundColor: color.canvas },
          headerTintColor: color.text,
          contentStyle: { backgroundColor: color.canvas },
        }}
      >
        <Stack.Protected guard={profile?.profileComplete === true}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="response-jobs"
            options={{ title: t("Response jobs") }}
          />
          <Stack.Screen
            name="embeddings"
            options={{ title: t("Embeddings") }}
          />
          <Stack.Screen
            name="conversation/[id]"
            options={{ title: t("Conversation") }}
          />
          <Stack.Screen
            name="groups"
            options={{ title: t("Conversation groups") }}
          />
          <Stack.Screen
            name="group/[id]"
            options={{ title: t("Group conversations") }}
          />
          <Stack.Screen
            name="job/[id]"
            options={{ title: t("Response job") }}
          />
          <Stack.Screen
            name="media/[kind]/[id]"
            options={{ title: t("Media result") }}
          />
          <Stack.Screen
            name="conversation/[id]/media"
            options={{ title: t("Create media") }}
          />
          <Stack.Screen
            name="conversation/[id]/files"
            options={{ title: t("Conversation files") }}
          />
          <Stack.Screen name="app/[id]" options={{ title: t("App details") }} />
          <Stack.Screen
            name="installation/[id]"
            options={{ title: t("Installed app") }}
          />
          <Stack.Screen
            name="account/billing"
            options={{ title: t("Credits and plan") }}
          />
          <Stack.Screen name="account/usage" options={{ title: t("Usage") }} />
          <Stack.Screen
            name="account/usage-details"
            options={{ title: t("Usage details") }}
          />
          <Stack.Screen
            name="account/preferences"
            options={{ title: t("Preferences") }}
          />
          <Stack.Screen
            name="account/keys"
            options={{ title: t("API keys") }}
          />
          <Stack.Screen
            name="account/domains"
            options={{ title: t("Domains") }}
          />
          <Stack.Screen
            name="account/memory"
            options={{ title: t("Memories") }}
          />
          <Stack.Screen
            name="account/alerts"
            options={{ title: t("Completion alerts") }}
          />
          <Stack.Screen
            name="account/profile"
            options={{ title: t("Profile and security") }}
          />
          <Stack.Screen
            name="account/photo"
            options={{ title: t("Profile photo") }}
          />
          <Stack.Screen
            name="account/delete"
            options={{ title: t("Delete account") }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!profile}>
          <Stack.Screen
            name="login"
            options={{ title: t("OpenJM"), headerBackVisible: false }}
          />
          <Stack.Screen
            name="anonymous-resources"
            options={{ title: t("Anonymous media and files") }}
          />
          <Stack.Screen
            name="register"
            options={{ title: t("Create account") }}
          />
          <Stack.Screen
            name="recover"
            options={{ title: t("Recover access") }}
          />
          <Stack.Screen
            name="anonymous"
            options={{ title: t("Anonymous chat") }}
          />
          <Stack.Screen
            name="reset-password"
            options={{ title: t("Reset password") }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!!profile && !profile.profileComplete}>
          <Stack.Screen
            name="complete-profile"
            options={{ title: t("Profile"), headerBackVisible: false }}
          />
        </Stack.Protected>
        <Stack.Screen name="legal" options={{ title: t("Legal documents") }} />
        <Stack.Screen
          name="language"
          options={{ title: t("Interface language") }}
        />
      </Stack>
    </>
  );
}
export default function Root() {
  useEffect(() => {
    void initializeLanguage();
  }, []);
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
