/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest factories use runtime mocks. */
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { DeleteAccountScreen } from "../../src/features/account/DeleteAccountScreen";
import { api } from "../../src/platform/runtime";
const mockReload = jest.fn(async () => {});
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    profile: { email: "avery@example.test" },
    reload: mockReload,
  }),
}));
jest.mock("../../src/platform/exports", () => ({
  clearExportFiles: require("@jest/globals").jest.fn(),
}));
jest.mock("../../src/platform/runtime", () => ({
  api: {
    request: require("@jest/globals").jest.fn(),
    session: { revision: () => 0, clear: require("@jest/globals").jest.fn() },
  },
}));
const request = jest.mocked(api.request);
beforeEach(() => {
  jest.clearAllMocks();
  request.mockReset();
});
test("account deletion requires typed confirmation and successful server OTP before deleting or clearing credentials", async () => {
  render(<DeleteAccountScreen />);
  expect(screen.getByText("avery@example.test")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Verify account deletion" }),
  ).toBeDisabled();
  fireEvent.changeText(
    screen.getByLabelText("Deletion confirmation"),
    "DELETE",
  );
  request.mockResolvedValueOnce({
    challengeId: "fictional",
    destinationHint: "a***@example.test",
    expiresAt: "2027-01-01T00:00:00Z",
    resendAvailableAt: "2026-01-01T00:00:00Z",
  });
  fireEvent.press(
    screen.getByRole("button", { name: "Verify account deletion" }),
  );
  await screen.findByLabelText("Verification code");
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
  request.mockRejectedValueOnce(new Error("Invalid fictional code"));
  fireEvent.press(
    screen.getByRole("button", { name: "Verify account deletion" }),
  );
  await screen.findByText("Invalid fictional code");
  expect(
    request.mock.calls.some(([, options]) => options?.method === "DELETE"),
  ).toBe(false);
  expect(api.session.clear).not.toHaveBeenCalled();
  request.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);
  fireEvent.press(
    screen.getByRole("button", { name: "Verify account deletion" }),
  );
  await waitFor(() => expect(api.session.clear).toHaveBeenCalledTimes(1));
  expect(request).toHaveBeenLastCalledWith("/v1/me", { method: "DELETE" });
  expect(mockReload).toHaveBeenCalledTimes(1);
});
