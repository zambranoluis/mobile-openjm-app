import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, findNodeHandle, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, usePathname } from "expo-router";
import type { Href } from "expo-router";
import { useAuth } from "../features/auth/AuthProvider";
import { useLanguage } from "../platform/language";
import { Brand } from "./Brand";
import { IconButton } from "./IconButton";
import { color, target } from "./theme";

type Destination = { label: string; href: Href; icon: React.ComponentProps<typeof Ionicons>["name"] };
const principal: Destination[] = [
  { label: "History", href: "/(tabs)", icon: "chatbubbles-outline" },
  { label: "New chat", href: "/conversation/new", icon: "create-outline" },
  { label: "Apps", href: "/(tabs)/apps", icon: "apps-outline" },
  { label: "Profile", href: "/(tabs)/account", icon: "person-outline" },
  { label: "Configuration", href: "/configuration", icon: "options-outline" },
];
const secondary: Destination[] = [
  { label: "Conversation groups", href: "/groups", icon: "folder-outline" },
  { label: "Response jobs", href: "/response-jobs", icon: "hourglass-outline" },
  { label: "Embeddings", href: "/embeddings", icon: "code-slash-outline" },
  { label: "Completion alerts", href: "/account/alerts", icon: "notifications-outline" },
  { label: "Legal documents", href: "/legal", icon: "document-text-outline" },
  { label: "Interface language", href: "/language", icon: "language-outline" },
];

export function WorkspaceHeader() {
  const [open, setOpen] = useState(false);
  const menu = useRef<View>(null), close = useRef<View>(null);
  const wasOpen = useRef(false);
  const auth = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  function focus(node: View | null) {
    if (!node) return;
    const handle = findNodeHandle(node);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
    (node as View & { focus?: () => void }).focus?.();
  }
  useEffect(() => {
    if (!open && wasOpen.current) {
      const frame = requestAnimationFrame(() => focus(menu.current));
      wasOpen.current = false;
      return () => cancelAnimationFrame(frame);
    }
    if (open) wasOpen.current = true;
  }, [open]);
  function navigate(href: Href) {
    setOpen(false);
    router.navigate(href);
  }
  const selected = (href: Href) => href === "/(tabs)" ? pathname === "/" : pathname === String(href).replace("/(tabs)", "");
  return <>
    <SafeAreaView edges={["top", "left", "right"]} style={styles.headerSafe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("Open profile")}
          onPress={() => router.navigate("/(tabs)/account")} style={styles.profile}>
          <Image accessible={false} source={require("../../assets/hummingbird.png")} style={styles.mark} />
        </Pressable>
        <Brand />
        <IconButton ref={menu} label="Open menu" icon="menu-outline" expanded={open} onPress={() => setOpen(true)} />
      </View>
    </SafeAreaView>
    <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}
      onShow={() => focus(close.current)} onDismiss={() => focus(menu.current)}>
      <View style={styles.overlay}>
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <SafeAreaView style={styles.drawer} accessibilityViewIsModal>
          <View style={styles.drawerTop}>
            <Brand />
            <IconButton ref={close} label="Close menu" icon="close-outline" onPress={() => setOpen(false)} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.menuContent}>
            <Text style={styles.name}>{[auth.profile?.name, auth.profile?.lastname].filter(Boolean).join(" ")}</Text>
            {[principal, secondary].map((section, index) => <View key={index} style={styles.section}>
              {section.map((item) => <Pressable key={item.label} accessibilityRole="button"
                accessibilityLabel={t(item.label)} accessibilityState={{ selected: selected(item.href) }}
                onPress={() => navigate(item.href)}
                style={({ pressed }) => [styles.item, selected(item.href) && styles.selected, pressed && styles.pressed]}>
                <Ionicons name={item.icon} size={22} color={selected(item.href) ? color.brand : color.secondary} accessible={false} />
                <Text style={styles.label}>{t(item.label)}</Text>
              </Pressable>)}
            </View>)}
            <Pressable accessibilityRole="button" accessibilityLabel={t("Sign out")}
              onPress={() => { setOpen(false); void auth.signOut(); }} style={styles.item}>
              <Ionicons name="log-out-outline" size={22} color={color.secondary} accessible={false} />
              <Text style={styles.label}>{t("Sign out")}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  headerSafe: { backgroundColor: "#22242B" },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  profile: { minWidth: target, minHeight: target, justifyContent: "center", alignItems: "center" },
  mark: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.canvas },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  drawer: { flex: 1, width: "84%", maxWidth: 336, backgroundColor: color.canvas },
  drawerTop: { paddingHorizontal: 16, minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuContent: { paddingHorizontal: 12, paddingBottom: 24, gap: 8 },
  name: { fontFamily: "Roboto-Medium", color: color.text, fontSize: 18, padding: 12 },
  section: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.outline, gap: 4 },
  item: { minHeight: target, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 8 },
  label: { fontFamily: "Roboto", color: color.text, fontSize: 16, flexShrink: 1 },
  selected: { backgroundColor: color.panel }, pressed: { backgroundColor: color.field },
});
