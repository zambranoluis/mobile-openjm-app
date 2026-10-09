import type { ExpoConfig } from "expo/config";
const releaseStage = process.env.APP_ENV ?? "development";
const fixture = process.env.OPENJM_FIXTURE_BUILD === "1";
if (fixture && (releaseStage !== "development" || process.env.EXPO_PUBLIC_MOBILE_API_URL !== "http://10.0.2.2:8097"))
  throw new Error("Fixture builds require development mode and the isolated emulator fixture origin.");
if (!["development", "staging", "private"].includes(releaseStage)) throw new Error("APP_ENV must be development, staging or private.");
if (["staging", "private"].includes(releaseStage)) {
  const value = process.env.EXPO_PUBLIC_MOBILE_API_URL;
  if (!value)
    throw new Error(
      "Set the staging HTTPS mobile gateway origin before building a release.",
    );
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Release builds require a plain HTTPS mobile gateway origin.",
    );
}
const config: ExpoConfig = {
  name: fixture ? "OpenJM Fixture" : "OpenJM",
  slug: "mobile-openjm-app",
  version: "0.1.0",
  scheme: fixture ? "openjm-fixture" : "openjm",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  icon: "./assets/icon.png",
  ios: { supportsTablet: false, bundleIdentifier: fixture ? "com.openjm.mobile.fixture" : "com.openjm.mobile" },
  android: {
    package: fixture ? "com.openjm.mobile.fixture" : "com.openjm.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/hummingbird.png",
      backgroundColor: "#080B0A",
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-font",
    "expo-asset",
    "expo-notifications",
    ["expo-video", {supportsBackgroundPlayback:false,supportsPictureInPicture:false}],
    ["expo-audio", {microphonePermission:false,recordAudioAndroid:false,enableBackgroundPlayback:false,enableBackgroundRecording:false}],
    ...(fixture ? ["./scripts/with-fixture-network.cjs"] : []),
  ],
  experiments: { typedRoutes: true },
  extra: { releaseStage, fixture, ...(process.env.EAS_PROJECT_ID ? {eas: {projectId: process.env.EAS_PROJECT_ID}} : {}) },
};
export default config;
