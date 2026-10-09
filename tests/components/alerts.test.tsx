/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest factories need runtime imports. */
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { beforeEach, expect, jest, test } from "@jest/globals";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "../../src/platform/runtime";
import { AlertsScreen } from "../../src/features/account/AlertsScreen";
import {
  disableAlerts,
  registerAlerts,
  reconcileAlerts,
} from "../../src/platform/notifications";
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { easConfig: { projectId: "11111111-1111-4111-8111-111111111111" } },
}));
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) =>
    require("react").useEffect(callback, [callback]),
}));
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: require("@jest/globals").jest.fn(),
  requestPermissionsAsync: require("@jest/globals").jest.fn(),
  setNotificationChannelAsync: require("@jest/globals").jest.fn(),
  getExpoPushTokenAsync: require("@jest/globals").jest.fn(),
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock("../../src/platform/runtime", () => ({
  api: {
    request: require("@jest/globals").jest.fn(),
    session: { revision: () => 0, snapshot: () => ({}) },
  },
}));
const request = jest.mocked(api.request),
  permission = jest.mocked(Notifications.getPermissionsAsync),
  ask = jest.mocked(Notifications.requestPermissionsAsync);
beforeEach(() => {
  jest.clearAllMocks();
  request.mockReset();
  permission.mockReset();
  ask.mockReset();
  jest.mocked(Notifications.getExpoPushTokenAsync).mockReset();
});
test("unavailable service never asks for notification permission", async () => {
  request.mockResolvedValue({ available: false, registered: false });
  render(<AlertsScreen />);
  await screen.findByText("Completion alerts are unavailable on this service.");
  expect(screen.getByRole("button", { name: "Enable alerts" })).toBeDisabled();
  expect(ask).not.toHaveBeenCalled();
});

test("invalid project configuration fails before any operating-system permission prompt", async () => {
  const config = Constants.easConfig!;
  const previous = config.projectId;
  config.projectId = "------------------------------------";
  try {
    await expect(registerAlerts()).rejects.toThrow(
      "not available in this build",
    );
    expect(permission).not.toHaveBeenCalled();
    expect(ask).not.toHaveBeenCalled();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  } finally {
    config.projectId = previous;
  }
});
test("permission denial keeps registration off without forwarding a device token", async () => {
  request.mockResolvedValue({ available: true, registered: false });
  const denied = {
    granted: false,
    status: "denied",
    canAskAgain: false,
    expires: "never",
  } as Notifications.NotificationPermissionsStatus;
  permission.mockResolvedValue(denied);
  ask.mockResolvedValue(denied);
  render(<AlertsScreen />);
  await screen.findByText("Alerts are off on this phone.");
  fireEvent.press(screen.getByRole("button", { name: "Enable alerts" }));
  await screen.findByText(
    "Notifications are disabled. You can enable them in your phone settings.",
  );
  await waitFor(() => expect(ask).toHaveBeenCalledTimes(1));
  expect(
    request.mock.calls.every(
      ([, options]) => !options?.method || options.method === "GET",
    ),
  ).toBe(true);
  expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
});
test("foreground reconciliation never requests permission for a phone without an opt-in", async () => {
  request.mockResolvedValue({ available: true, registered: false });
  await reconcileAlerts();
  expect(permission).not.toHaveBeenCalled();
  expect(ask).not.toHaveBeenCalled();
  expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
});
test("revoked operating-system permission removes an existing registration", async () => {
  request.mockResolvedValue({ available: true, registered: true });
  permission.mockResolvedValue({
    granted: false,
  } as Notifications.NotificationPermissionsStatus);
  await reconcileAlerts();
  expect(request).toHaveBeenLastCalledWith("/v1/notifications/device", {
    method: "DELETE",
  });
  expect(ask).not.toHaveBeenCalled();
});
test("turning alerts off during token reconciliation cannot recreate the registration", async () => {
  request.mockResolvedValue({ available: true, registered: true });
  permission.mockResolvedValue({
    granted: true,
  } as Notifications.NotificationPermissionsStatus);
  let deliver: ((value: Notifications.ExpoPushToken) => void) | undefined;
  jest.mocked(Notifications.getExpoPushTokenAsync).mockImplementation(
    () =>
      new Promise((resolve) => {
        deliver = resolve;
      }),
  );
  const refreshing = reconcileAlerts();
  await waitFor(() => expect(deliver).toBeDefined());
  const disabling = disableAlerts();
  deliver!({ type: "expo", data: "ExpoPushToken[fictional-replacement]" });
  await Promise.all([refreshing, disabling]);
  expect(
    request.mock.calls.filter(([, options]) => options?.method === "POST"),
  ).toHaveLength(0);
  expect(request).toHaveBeenLastCalledWith("/v1/notifications/device", {
    method: "DELETE",
  });
});
