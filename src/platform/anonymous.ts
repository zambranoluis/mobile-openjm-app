import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { anonymousResources } from "../features/anonymous/anonymousModel";
const sessionKey = "openjm.anonymous.session.v1";
const secureOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
let pending: Promise<string> | null = null;
export const publicResources = anonymousResources(
  AsyncStorage,
  {
    getItem: (key) => SecureStore.getItemAsync(key, secureOptions),
    setItem: (key, value) =>
      SecureStore.setItemAsync(key, value, secureOptions),
    removeItem: (key) => SecureStore.deleteItemAsync(key, secureOptions),
  },
  Crypto.randomUUID,
);
export function anonymousSession() {
  pending ??= (async () => {
    const prior = await SecureStore.getItemAsync(sessionKey, secureOptions);
    if (prior && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(prior))
      return prior;
    const value = Crypto.randomUUID();
    await SecureStore.setItemAsync(sessionKey, value, secureOptions);
    return value;
  })().catch((failure) => {
    pending = null;
    throw failure;
  });
  return pending;
}
export async function clearAnonymousDeviceSession(session: string) {
  await publicResources.clear(session);
  await SecureStore.deleteItemAsync(sessionKey, secureOptions);
  pending = null;
}
