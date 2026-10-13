import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";

export function useDecorativeClock(enabled = true) {
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [reduced, setReduced] = useState(true);
  const time = useSharedValue(0), elapsed = useSharedValue(0);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReduced(value); }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    const app = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  const frame = useFrameCallback((info) => {
    elapsed.value += Math.min(info.timeSincePreviousFrame ?? 0, 100);
    const next = Math.floor(elapsed.value / (1000 / 30)) / 30;
    if (next !== time.value) time.value = next;
  }, false);
  const active = enabled && focused && foreground && !reduced;
  useEffect(() => {
    frame.setActive(active);
    return () => frame.setActive(false);
  }, [active, frame]);
  return time;
}
