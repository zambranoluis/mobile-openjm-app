/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest factories need runtime imports. */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { expect, jest, test } from "@jest/globals";
import { ResetPasswordScreen } from "../../src/features/auth/ResetPasswordScreen";
import { api } from "../../src/platform/runtime";
import { router } from "expo-router";
jest.mock("expo-router", () => ({
  router: {
    setParams: require("@jest/globals").jest.fn(),
    replace: require("@jest/globals").jest.fn(),
  },
  useLocalSearchParams: () => ({ token: "fictional-token" }),
}));
jest.mock("../../src/platform/runtime", () => ({
  api: {
    configured: true,
    request: require("@jest/globals").jest.fn(async () => undefined),
  },
}));
test("reset uses a public one-time operation, clears secret fields and waits for server success", async () => {
  render(<ResetPasswordScreen />);
  expect(router.setParams).toHaveBeenCalledWith({ token: undefined });
  fireEvent.changeText(
    screen.getByLabelText("New password"),
    "fictional-password",
  );
  fireEvent.changeText(
    screen.getByLabelText("Confirm new password"),
    "fictional-password",
  );
  fireEvent.press(screen.getByRole("button", { name: "Reset password" }));
  await screen.findByText(
    "Your password was reset. Sign in with your new password.",
  );
  expect(api.request).toHaveBeenCalledWith(
    "/v1/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({
        token: "fictional-token",
        password: "fictional-password",
      }),
    },
    false,
  );
  expect(screen.queryByLabelText("Reset link or token")).toBeNull();
});
