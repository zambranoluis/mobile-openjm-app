import { useSyncExternalStore } from "react";
import approved from "../../assets/locales/approved-web-copy.json";
import native from "../../assets/locales/native-copy.json";
import { language, translated } from "../ui/languageModel";
import type { Language } from "../ui/languageModel";
const copy = { ...approved, ...native };
let selected: Language = "en",
  revision = 0,
  initial: Promise<void> | null = null,
  writes: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>(),
  key = "openjm.interface-language.v1";
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
function publish(value: Language) {
  selected = value;
  for (const listener of listeners) listener();
}
export function initializeLanguage() {
  const expected = revision;
  initial ??= import("@react-native-async-storage/async-storage")
    .then(({ default: storage }) => storage.getItem(key))
    .then((value) => {
      if (expected === revision) publish(language(value));
    })
    .catch(() => {});
  return initial;
}
export async function selectLanguage(value: Language) {
  const expected = ++revision;
  const writing = writes
    .catch(() => {})
    .then(async () => {
      const { default: storage } = await import(
        "@react-native-async-storage/async-storage"
      );
      await storage.setItem(key, value);
    });
  writes = writing;
  await writing;
  if (expected === revision) publish(value);
}
export function useLanguage() {
  const current = useSyncExternalStore(
    subscribe,
    () => selected,
    () => "en" as Language,
  );
  return {
    language: current,
    t: (source: string) => translated(copy, source, current),
  };
}
