import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { color } from "../../src/ui/theme";
import { useLanguage } from "../../src/platform/language";
export default function TabLayout() {
  const { t } = useLanguage();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.canvas },
        headerTintColor: color.text,
        tabBarStyle: { backgroundColor: color.panel },
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.secondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("Conversations"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: t("Apps"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="apps-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("Account"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
