import { router } from "expo-router";
import { Row, Screen, Title } from "../../ui/controls";

export function ConfigurationScreen() {
  return <Screen>
    <Title localize>Configuration</Title>
    <Row localize title="Saved memories" onPress={() => router.push("/account/memory")} />
    <Row localize title="Conversation preferences" onPress={() => router.push("/account/preferences")} />
    <Row localize title="Domains" onPress={() => router.push("/account/domains")} />
    <Row localize title="API keys" onPress={() => router.push("/account/keys")} />
  </Screen>;
}
