import { Platform } from "react-native";
export const color = {
  canvas: "#080B0A",
  panel: "#151A19",
  field: "#1B2023",
  text: "#F2F4F3",
  secondary: "#A9B5AF",
  muted: "#84928B",
  brand: "#52B583",
  action: "#19D18C",
  pressed: "#19B87C",
  danger: "#F05257",
  outline: "#34443D",
};
export const text = {
  body: Platform.OS === "ios" ? 17 : 16,
  title: 30,
  label: 16,
  metadata: 13,
};
export const target = Platform.OS === "android" ? 48 : 44;
