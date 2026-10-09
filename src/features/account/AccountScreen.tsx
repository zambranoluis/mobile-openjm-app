import { router } from "expo-router";
import { Button, Copy, Feedback, Row, Screen, Title } from "../../ui/controls";
import { useAuth } from "../auth/AuthProvider";
export function AccountScreen() {
  const auth = useAuth();
  return (
    <Screen>
      <Title localize>Account</Title>
      <Copy>
        {auth.profile?.name} {auth.profile?.lastname}
      </Copy>
      <Copy muted>{auth.profile?.email}</Copy>
      <Feedback message={auth.error} />
      <Row
        localize
        title="Profile and security"
        onPress={() => router.push("/account/profile")}
        detail={
          auth.profile?.twoFactorEnabled
            ? "Two-factor authentication enabled"
            : "Two-factor authentication not enabled"
        }
      />
      <Row
        localize
        title="Credits and plan"
        onPress={() => router.push("/account/billing")}
      />
      <Row
        localize
        title="Usage"
        onPress={() => router.push("/account/usage")}
      />
      <Row
        localize
        title="Conversation preferences"
        onPress={() => router.push("/account/preferences")}
      />
      <Row
        localize
        title="API keys"
        onPress={() => router.push("/account/keys")}
      />
      <Row
        localize
        title="Domains"
        onPress={() => router.push("/account/domains")}
      />
      <Row
        localize
        title="Saved memories"
        onPress={() => router.push("/account/memory")}
      />
      <Row
        localize
        title="Completion alerts"
        onPress={() => router.push("/account/alerts")}
      />
      <Row
        localize
        title="Legal documents"
        onPress={() => router.push("/legal")}
      />
      <Row
        localize
        title="Interface language"
        onPress={() => router.push("/language")}
      />
      <Button
        label="Refresh account"
        secondary
        onPress={() => void auth.reload().catch(() => {})}
      />
      <Button label="Sign out" secondary onPress={() => void auth.signOut()} />
    </Screen>
  );
}
