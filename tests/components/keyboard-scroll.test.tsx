import { act, fireEvent, render } from "@testing-library/react-native";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { Keyboard, ScrollView, Text, TextInput } from "react-native";
import type { KeyboardEvent } from "react-native";
import { KeyboardScroll, useInputReveal } from "../../src/ui/KeyboardScroll";

let keyboardShown: (event: KeyboardEvent) => void;
let frame: FrameRequestCallback | null;
const scrollTo = jest.fn<ScrollView["scrollTo"]>();
const input = {
  measureInWindow: jest.fn(
    (callback: (x: number, y: number, width: number, height: number) => void) => {
      callback(24, 400, 312, 50);
    },
  ),
} as unknown as TextInput;

function FocusControl() {
  const reveal = useInputReveal();
  return (
    <>
      <Text onPress={() => reveal?.focus(input)}>Focus input</Text>
      <Text onPress={() => reveal?.blur(input)}>Blur input</Text>
    </>
  );
}
function flushFrame() {
  act(() => {
    const callback = frame;
    frame = null;
    callback?.(0);
  });
}
function showKeyboard() {
  act(() => keyboardShown({
    duration: 0,
    easing: "keyboard",
    endCoordinates: { screenX: 0, screenY: 340, width: 360, height: 300 },
  }));
}
beforeEach(() => {
  frame = null;
  scrollTo.mockClear();
  jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(scrollTo);
  jest.spyOn(global, "requestAnimationFrame").mockImplementation((callback) => {
    frame = callback;
    return 1;
  });
  jest.spyOn(global, "cancelAnimationFrame").mockImplementation(() => {
    frame = null;
  });
  jest.spyOn(Keyboard, "metrics").mockReturnValue(undefined);
  jest.spyOn(Keyboard, "addListener").mockImplementation((name, callback) => {
    if (name === "keyboardDidShow") keyboardShown = callback;
    return { remove: () => {} } as ReturnType<typeof Keyboard.addListener>;
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});

test("remeasures the focused field after the keyboard resizes the viewport", () => {
  const onLayout = jest.fn();
  const screen = render(
    <KeyboardScroll onLayout={onLayout}><FocusControl /></KeyboardScroll>,
  );
  const scroll = screen.UNSAFE_getByType(ScrollView);
  expect(scroll.props.removeClippedSubviews).toBe(false);
  fireEvent.press(screen.getByText("Focus input"));
  showKeyboard();
  flushFrame();
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 126, animated: false });
  scrollTo.mockClear();
  // The first scroll may be clamped before Android commits its resized layout.
  fireEvent(scroll, "layout", {
    nativeEvent: { layout: { x: 0, y: 80, width: 360, height: 260 } },
  });
  flushFrame();
  expect(onLayout).toHaveBeenCalledTimes(1);
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 126, animated: false });
  screen.unmount();
});

test("a pending reveal cannot scroll after the input loses focus", () => {
  const screen = render(
    <KeyboardScroll><FocusControl /></KeyboardScroll>,
  );
  fireEvent.press(screen.getByText("Focus input"));
  showKeyboard();
  fireEvent.press(screen.getByText("Blur input"));
  flushFrame();
  expect(scrollTo).not.toHaveBeenCalled();
  screen.unmount();
});
