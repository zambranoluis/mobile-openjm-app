import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
/** A screen's late network result cannot reopen data or secrets after it loses focus. */
export function useFeatureTask() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null),
    focused = useRef(false),
    revision = useRef(0);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setBusy(false);
      return () => {
        focused.current = false;
        revision.current++;
        active.current?.abort();
        active.current = null;
      };
    }, []),
  );
  const run = useCallback(
    async <T>(
      work: (signal: AbortSignal) => Promise<T>,
      deliver?: (result: T) => void,
    ) => {
      if (active.current || !focused.current) return;
      const controller = new AbortController(),
        expected = ++revision.current;
      active.current = controller;
      setBusy(true);
      setError(null);
      try {
        const result = await work(controller.signal);
        if (focused.current && revision.current === expected) deliver?.(result);
      } catch (failure) {
        if (focused.current && revision.current === expected)
          setError(
            failure instanceof Error
              ? failure.message
              : "The request could not be confirmed.",
          );
        throw failure;
      } finally {
        if (active.current === controller) active.current = null;
        if (focused.current && revision.current === expected) setBusy(false);
      }
    },
    [],
  );
  return { busy, error, run };
}
