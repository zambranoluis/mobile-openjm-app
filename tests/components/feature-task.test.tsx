/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest router mock. */
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { expect, jest, test } from "@jest/globals";
import { useState } from "react";
import { Button, Copy } from "../../src/ui/controls";
import { useFeatureTask } from "../../src/ui/useFeatureTask";
let mockFocused = true;
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void | (() => void)) =>
    require("react").useEffect(
      () => (mockFocused ? callback() : undefined),
      [callback, mockFocused],
    ),
}));
test("losing focus aborts a read and allows a fresh read without delivering or unlocking the stale response", async () => {
  const pending: { resolve: (value: string) => void; signal: AbortSignal }[] =
    [];
  function Harness() {
    const task = useFeatureTask(),
      [value, setValue] = useState("No response");
    return (
      <>
        <Copy>{value}</Copy>
        <Copy>{task.busy ? "Reading" : "Idle"}</Copy>
        <Button
          label="Read"
          onPress={() =>
            void task
              .run(
                (signal) =>
                  new Promise<string>((resolve) =>
                    pending.push({ resolve, signal }),
                  ),
                setValue,
              )
              .catch(() => {})
          }
        />
      </>
    );
  }
  const view = render(<Harness />);
  fireEvent.press(screen.getByRole("button", { name: "Read" }));
  expect(pending).toHaveLength(1);
  mockFocused = false;
  view.rerender(<Harness />);
  expect(pending[0].signal.aborted).toBe(true);
  mockFocused = true;
  view.rerender(<Harness />);
  fireEvent.press(screen.getByRole("button", { name: "Read" }));
  expect(pending).toHaveLength(2);
  await act(async () => pending[0].resolve("Stale private response"));
  expect(screen.queryByText("Stale private response")).toBeNull();
  expect(screen.getByText("Reading")).toBeTruthy();
  await act(async () => pending[1].resolve("Current response"));
  expect(screen.getByText("Current response")).toBeTruthy();
  expect(screen.getByText("Idle")).toBeTruthy();
});
