import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Keyboard, ScrollView, TextInput } from "react-native";
import type { ScrollViewProps } from "react-native";
type Focus = {
  focus: (input: TextInput | null) => void;
  blur: (input: TextInput | null) => void;
};
const FocusContext = createContext<Focus | null>(null);
export const useInputReveal = () => useContext(FocusContext);
/** Reveal the actual focused field in long forms when the keyboard appears. */
export function KeyboardScroll({
  children,
  onScroll,
  onContentSizeChange,
  ...props
}: ScrollViewProps) {
  const scroll = useRef<ScrollView | null>(null),
    active = useRef<TextInput | null>(null),
    offset = useRef(0),
    keyboardTop = useRef<number | null>(null),
    frame = useRef<number | null>(null);
  const reveal = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const input = active.current,
        top = keyboardTop.current;
      if (!input || top === null) return;
      input.measureInWindow((_x, y, _width, height) => {
        if (active.current !== input || keyboardTop.current === null) return;
        const obscured = y + height + 16 - keyboardTop.current;
        if (Number.isFinite(obscured) && obscured > 0)
          scroll.current?.scrollTo({
            y: Math.max(0, offset.current + obscured),
            animated: false,
          });
      });
    });
  }, []);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      reveal();
    });
    const hidden = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTop.current = null;
    });
    return () => {
      shown.remove();
      hidden.remove();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [reveal]);
  const focus = useCallback(
    (input: TextInput | null) => {
      active.current = input;
      keyboardTop.current = Keyboard.metrics()?.screenY ?? keyboardTop.current;
      reveal();
    },
    [reveal],
  );
  const blur = useCallback((input: TextInput | null) => {
    if (active.current === input) active.current = null;
  }, []);
  return (
    <FocusContext.Provider value={{ focus, blur }}>
      <ScrollView
        {...props}
        ref={scroll}
        scrollEventThrottle={16}
        onScroll={(event) => {
          offset.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
        onContentSizeChange={(width, height) => {
          onContentSizeChange?.(width, height);
          reveal();
        }}
      >
        {children}
      </ScrollView>
    </FocusContext.Provider>
  );
}
