import { forwardRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { color, target } from "./theme";
import { useLanguage } from "../platform/language";

export const IconButton = forwardRef<View, {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  expanded?: boolean;
  disabled?: boolean;
}>(({ label, icon, onPress, expanded, disabled }, ref) => {
  const { t } = useLanguage();
  return <Pressable ref={ref} accessibilityRole="button" accessibilityLabel={t(label)}
    accessibilityState={{ disabled, ...(expanded === undefined ? {} : { expanded }) }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
    <Ionicons name={icon} size={24} color={color.text} accessible={false} />
  </Pressable>;
});
IconButton.displayName = "IconButton";
const styles = StyleSheet.create({
  control: { minWidth: target, minHeight: target, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  pressed: { backgroundColor: color.field },
});
