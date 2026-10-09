import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TextInputProps } from "react-native";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { color, target, text } from "./theme";
import { useLanguage } from "../platform/language";
import { useRef } from "react";
import { KeyboardScroll, useInputReveal } from "./KeyboardScroll";

export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 0}
      >
        {scroll ? (
          <KeyboardScroll
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            {children}
          </KeyboardScroll>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Copy({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <Text selectable style={[styles.copy, muted && styles.secondary]}>
      {children}
    </Text>
  );
}
export function Title({
  children,
  localize = false,
}: {
  children: ReactNode;
  localize?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {localize && typeof children === "string" ? t(children) : children}
    </Text>
  );
}
export function Feedback({ message }: { message: string | null }) {
  return message ? (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.feedback}
    >
      {message}
    </Text>
  ) : null;
}
export function Button({
  label,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const { t } = useLanguage();
  const translated = t(label);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translated}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        pressed && styles.pressed,
        (disabled || busy) && styles.disabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? color.text : color.canvas} />
      ) : (
        <Text style={[styles.label, secondary && styles.secondaryLabel]}>
          {translated}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  localize = true,
  ...props
}: TextInputProps & { label: string; localize?: boolean }) {
  const input = useRef<TextInput | null>(null),
    reveal = useInputReveal();
  const { t } = useLanguage();
  const translated = localize ? t(label) : label;
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{translated}</Text>
      <TextInput
        {...props}
        ref={input}
        onFocus={(event) => {
          reveal?.focus(input.current);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          reveal?.blur(input.current);
          props.onBlur?.(event);
        }}
        accessibilityLabel={translated}
        placeholderTextColor={color.muted}
        style={[styles.input, props.style]}
      />
    </View>
  );
}
export function Row({
  title,
  detail,
  onPress,
  localize = false,
}: {
  title: string;
  detail?: string;
  onPress?: () => void;
  localize?: boolean;
}) {
  const { t } = useLanguage();
  const translated = localize ? t(title) : title;
  const body = (
    <>
      <Text style={styles.rowTitle}>{translated}</Text>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translated}
      onPress={onPress}
      style={styles.row}
    >
      {body}
    </Pressable>
  ) : (
    <View style={styles.row}>{body}</View>
  );
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  content: { padding: 24, gap: 16, paddingBottom: 32 },
  copy: { fontSize: text.body, lineHeight: 25, color: color.text },
  secondary: { color: color.secondary },
  title: {
    fontSize: text.title,
    fontWeight: "600",
    color: color.text,
    marginBottom: 8,
  },
  feedback: { color: color.danger, fontSize: text.body, lineHeight: 25 },
  button: {
    minHeight: target,
    padding: 14,
    backgroundColor: color.action,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: { backgroundColor: color.panel },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  label: {
    color: color.canvas,
    fontSize: text.label,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryLabel: { color: color.text },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: color.secondary, fontSize: text.label },
  input: {
    minHeight: target,
    backgroundColor: color.field,
    color: color.text,
    padding: 14,
    borderRadius: 8,
    fontSize: text.body,
  },
  row: {
    paddingVertical: 16,
    minHeight: target,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: color.outline,
    gap: 6,
  },
  rowTitle: { color: color.text, fontSize: text.body, fontWeight: "500" },
  rowDetail: {
    color: color.secondary,
    fontSize: text.metadata,
    lineHeight: 20,
  },
});
