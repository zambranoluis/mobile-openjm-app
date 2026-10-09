import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { LoginScreen } from "../../src/features/auth/LoginScreen";
import { api } from "../../src/platform/runtime";
/* eslint-disable @typescript-eslint/no-require-imports -- Jest factories run before static imports. */
import { beforeEach, expect, jest, test } from "@jest/globals";
const mockReload = jest.fn(async () => {});
jest.mock("expo-router", () => ({
  router: { push: require("@jest/globals").jest.fn() },
}));
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ reload: mockReload, error: null }),
}));
jest.mock("../../src/platform/runtime", () => ({
  api: {
    configured: true,
    request: require("@jest/globals").jest.fn(),
    session: {
      revision: () => 0,
      accept: require("@jest/globals").jest.fn(async () => {}),
    },
  },
}));
const request = jest.mocked(api.request);
const issued = {
  accessToken: "fixture-access",
  refreshToken: "fixture-refresh",
  userId: "fixture-user",
  accessTokenExpiresAt: "2027-01-01T00:00:00Z",
  sessionExpiresAt: "2027-01-02T00:00:00Z",
};
function submit() {
  fireEvent.changeText(screen.getByLabelText("Email"), "avery@example.test");
  fireEvent.changeText(screen.getByLabelText("Password"), "fictional-password");
  fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
}
beforeEach(() => {
  jest.clearAllMocks();
});
test("MFA replaces the password field and stores no credential before successful verification", async () => {
  request.mockResolvedValueOnce({
    flow: {
      nextStep: "OTP_REQUIRED",
      challenge: {
        challengeId: "fixture-challenge",
        resendAvailableAt: "2027-01-01T00:00:00Z",
      },
    },
    credentials: null,
  });
  render(<LoginScreen />);
  submit();
  await screen.findByLabelText("Verification code");
  expect(screen.queryByLabelText("Password")).toBeNull();
  expect(api.session.accept).not.toHaveBeenCalled();
  request.mockResolvedValueOnce({
    flow: { nextStep: "AUTHENTICATED", login: { userId: "fixture-user" } },
    credentials: issued,
  });
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
  fireEvent.press(screen.getByRole("button", { name: "Verify and sign in" }));
  await waitFor(() =>
    expect(api.session.accept).toHaveBeenCalledWith(issued, 0),
  );
  await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1));
});
test("a challenge containing credentials is rejected without creating a native session", async () => {
  request.mockResolvedValueOnce({
    flow: {
      nextStep: "OTP_REQUIRED",
      challenge: { challengeId: "fixture-challenge" },
    },
    credentials: issued,
  });
  render(<LoginScreen />);
  submit();
  await screen.findByText("The sign-in response could not be used.");
  expect(api.session.accept).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Password")).toHaveProp("secureTextEntry", true);
});
