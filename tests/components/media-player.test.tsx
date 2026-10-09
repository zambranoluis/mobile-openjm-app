/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest factories require React at runtime. */
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { AppState } from "react-native";
import { MediaPlayer } from "../../src/platform/MediaPlayer";
import { setAudioModeAsync } from "expo-audio";
const mockPlayer = {
  pause: jest.fn(),
  play: jest.fn(),
  seekTo: jest.fn(async () => {}),
};
let mockStatus = {
  playing: false,
  isLoaded: true,
  currentTime: 3,
  duration: 300,
  didJustFinish: false,
};
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) =>
    require("react").useEffect(callback, [callback]),
}));
jest.mock("expo-audio", () => ({
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => mockStatus,
  setAudioModeAsync: require("@jest/globals").jest.fn(async () => {}),
}));
jest.mock("expo-video", () => ({
  useVideoPlayer: () => ({}),
  VideoView: () => null,
}));
jest.mock("expo", () => ({ useEvent: () => ({}) }));
let listener: (state: "active" | "background") => void = () => {};
beforeEach(() => {
  jest.clearAllMocks();
  AppState.currentState = "active";
  mockStatus = {
    playing: false,
    isLoaded: true,
    currentTime: 3,
    duration: 300,
    didJustFinish: false,
  };
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, callback) => {
      listener = callback;
      return { remove: () => {} };
    });
});
afterEach(() => {
  jest.restoreAllMocks();
});
test("native foreground auto-resume is stopped until the user presses play again", async () => {
  const screen = render(
    <MediaPlayer kind="music" uri="file:///fictional.wav" />,
  );
  fireEvent.press(screen.getByText("Play music"));
  await waitFor(() => expect(mockPlayer.play).toHaveBeenCalledTimes(1));
  mockStatus = { ...mockStatus, playing: true };
  screen.rerender(<MediaPlayer kind="music" uri="file:///fictional.wav" />);
  act(() => {
    AppState.currentState = "background";
    listener("background");
  });
  expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
  mockStatus = { ...mockStatus, playing: false };
  screen.rerender(<MediaPlayer kind="music" uri="file:///fictional.wav" />);
  act(() => {
    AppState.currentState = "active";
    listener("active");
  });
  mockStatus = { ...mockStatus, playing: true };
  screen.rerender(<MediaPlayer kind="music" uri="file:///fictional.wav" />);
  expect(mockPlayer.pause).toHaveBeenCalledTimes(2);
  mockStatus = { ...mockStatus, playing: false };
  screen.rerender(<MediaPlayer kind="music" uri="file:///fictional.wav" />);
  fireEvent.press(screen.getByText("Play music"));
  await waitFor(() => expect(mockPlayer.play).toHaveBeenCalledTimes(2));
});
test("a play request waiting for audio configuration cannot start in the background", async () => {
  let finish: () => void = () => {};
  jest.mocked(setAudioModeAsync).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const screen = render(
    <MediaPlayer kind="music" uri="file:///fictional.wav" />,
  );
  fireEvent.press(screen.getByText("Play music"));
  await act(async () => {
    AppState.currentState = "background";
    listener("background");
    finish();
  });
  expect(mockPlayer.play).not.toHaveBeenCalled();
});
