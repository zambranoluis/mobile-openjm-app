import { loadAsync } from "expo-font";

// Local assets only. Font failure leaves the OS fallback available; entry is never gated.
export function loadBrandFonts() {
  return loadAsync({
    Roboto: require("../../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Medium": require("../../assets/fonts/Roboto-Medium.ttf"),
    "Roboto-Bold": require("../../assets/fonts/Roboto-Bold.ttf"),
  });
}
