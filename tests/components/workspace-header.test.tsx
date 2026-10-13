/* eslint-disable @typescript-eslint/no-require-imports -- Jest factories are hoisted. */
import { fireEvent, render } from "@testing-library/react-native";
import { expect, jest, test } from "@jest/globals";
import { router } from "expo-router";
import { WorkspaceHeader } from "../../src/ui/WorkspaceHeader";
jest.mock("expo-router", () => ({ router: { navigate: require("@jest/globals").jest.fn() }, usePathname: () => "/" }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { name: "Avery", lastname: "Sample" }, signOut: require("@jest/globals").jest.fn() }) }));
jest.mock("@expo/vector-icons/Ionicons", () => () => null);
test("drawer closes on native Back and exposes protected secondary destinations without a tab bar", () => {
  const view = render(<WorkspaceHeader />);
  fireEvent.press(view.getByRole("button", { name: "Open menu" }));
  expect(view.getByRole("button", { name: "Configuration" })).toBeTruthy();
  expect(view.getByRole("button", { name: "Response jobs" })).toBeTruthy();
  expect(view.getByRole("button", { name: "Embeddings" })).toBeTruthy();
  fireEvent(view.UNSAFE_getByType(require("react-native").Modal), "requestClose");
  expect(view.queryByRole("button", { name: "Configuration" })).toBeNull();
  fireEvent.press(view.getByRole("button", { name: "Open menu" }));
  fireEvent.press(view.getByRole("button", { name: "Apps" }));
  expect(router.navigate).toHaveBeenCalledWith("/(tabs)/apps");
  expect(view.queryByRole("button", { name: "Configuration" })).toBeNull();
});
