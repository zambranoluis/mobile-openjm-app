import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { fetch as expoFetch } from "expo/fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MobileClient } from "../api/client";
import { guardedCredentials } from "../api/credentialStore";

const options = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const refreshKey = "openjm.native.refresh.v1";
let installationPromise: Promise<string> | null = null;
async function installation() {
  installationPromise ??= (async () => {
    const saved = await SecureStore.getItemAsync(
      "openjm.native.installation.v1",
    );
    if (
      saved &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        saved,
      )
    )
      return saved;
    const id = Crypto.randomUUID();
    await SecureStore.setItemAsync(
      "openjm.native.installation.v1",
      id,
      options,
    );
    return id;
  })().catch((failure) => {
    installationPromise = null;
    throw failure;
  });
  return installationPromise;
}
export const api = new MobileClient(
  process.env.EXPO_PUBLIC_MOBILE_API_URL ?? "",
  installation,
  guardedCredentials(
    {
      read: () => SecureStore.getItemAsync(refreshKey),
      write: (value) => SecureStore.setItemAsync(refreshKey, value, options),
      remove: () => SecureStore.deleteItemAsync(refreshKey),
    },
    {
      read: () => AsyncStorage.getItem("openjm.native.signed-out.v1"),
      write: () => AsyncStorage.setItem("openjm.native.signed-out.v1", "1"),
      remove: () => AsyncStorage.removeItem("openjm.native.signed-out.v1"),
    },
  ),
  expoFetch as typeof fetch,
);
