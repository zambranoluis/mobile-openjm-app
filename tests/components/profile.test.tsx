/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest factories need runtime imports. */
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { beforeEach, expect, jest, test } from "@jest/globals";
import { ProfileScreen } from "../../src/features/account/ProfileScreen";
import { api } from "../../src/platform/runtime";
const mockReload = jest.fn(async () => {});
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    profile: {
      id: "fixture",
      name: "Avery",
      lastname: "Sample",
      email: "avery@example.test",
      phone: { areaCode: "+1", number: "5550100" },
    },
    reload: mockReload,
  }),
}));
jest.mock("../../src/platform/runtime", () => ({
  api: { request: require("@jest/globals").jest.fn() },
}));
jest.mock("../../src/features/account/TwoFactorSettings", () => ({
  TwoFactorSettings: () => null,
}));
const request = jest.mocked(api.request);
beforeEach(() => {
  jest.clearAllMocks();
});
test("profile verification waits for confirmed server change before reloading account", async () => {
  request.mockResolvedValueOnce({
    nextStep: "OTP_REQUIRED",
    challenge: {
      challengeId: "fixture",
      destinationHint: "a***@example.test",
      expiresAt: "2027-01-02T00:00:00Z",
      resendAvailableAt: "2027-01-01T00:00:00Z",
    },
  });
  render(<ProfileScreen />);
  fireEvent.changeText(screen.getByLabelText("First name"), "Updated");
  fireEvent.press(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByLabelText("Verification code");
  expect(mockReload).not.toHaveBeenCalled();
  expect(screen.queryByText("Profile updated.")).toBeNull();
  request.mockResolvedValueOnce({ nextStep: "UPDATED" });
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
  fireEvent.press(screen.getByRole("button", { name: "Confirm change" }));
  await screen.findByText("Profile updated.");
  await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1));
  expect(request.mock.calls[1][0]).toBe("/v1/me/profile/verify-otp");
});
