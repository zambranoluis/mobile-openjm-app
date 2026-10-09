/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest factories use runtime mocks. */
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SensitiveAction } from "../../src/features/account/SensitiveAction";
import { api } from "../../src/platform/runtime";
jest.mock("../../src/platform/runtime", () => ({
  api: {
    request: require("@jest/globals").jest.fn(),
    session: { revision: () => 0 },
  },
}));
const request = jest.mocked(api.request);
beforeEach(() => {
  jest.clearAllMocks();
});
test("an account export requires a successful server verification before reading private data", async () => {
  const perform = jest.fn(async () => {});
  request.mockResolvedValueOnce({
    challengeId: "fixture-challenge",
    destinationHint: "a***@example.test",
    expiresAt: "2027-01-01T00:00:00Z",
    resendAvailableAt: "2026-01-01T00:00:00Z",
  });
  render(
    <SensitiveAction
      action="ACCOUNT_EXPORT"
      label="Save export"
      perform={perform}
    />,
  );
  fireEvent.press(screen.getByRole("button", { name: "Save export" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Verification code")).toBeTruthy(),
  );
  expect(perform).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
  request.mockRejectedValueOnce(new Error("The code is invalid."));
  fireEvent.press(screen.getByRole("button", { name: "Save export" }));
  await waitFor(() =>
    expect(screen.getByText("The code is invalid.")).toBeTruthy(),
  );
  expect(perform).not.toHaveBeenCalled();
  request.mockResolvedValueOnce(null);
  fireEvent.press(screen.getByRole("button", { name: "Save export" }));
  await waitFor(() => expect(perform).toHaveBeenCalledTimes(1));
  expect(request).toHaveBeenLastCalledWith(
    "/v1/me/security/sensitive-actions/verify",
    expect.objectContaining({
      body: JSON.stringify({
        challengeId: "fixture-challenge",
        code: "123456",
      }),
    }),
  );
});

test("closing a verification panel prevents a late verification response from executing the action", async () => {
  const perform = jest.fn(async () => {});
  request.mockResolvedValueOnce({
    challengeId: "fixture",
    destinationHint: "a***@example.test",
    expiresAt: "2027-01-01T00:00:00Z",
    resendAvailableAt: "2026-01-01T00:00:00Z",
  });
  const { unmount } = render(
    <SensitiveAction
      action="API_KEY_REVOKE"
      resourceId="key-fixture"
      label="Revoke verified key"
      perform={perform}
    />,
  );
  fireEvent.press(screen.getByRole("button", { name: "Revoke verified key" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Verification code")).toBeTruthy(),
  );
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
  let complete!: () => void;
  request.mockImplementationOnce(async () => {
    await new Promise<void>((resolve) => {
      complete = resolve;
    });
    return undefined as never;
  });
  fireEvent.press(screen.getByRole("button", { name: "Revoke verified key" }));
  unmount();
  await act(async () => {
    complete();
  });
  expect(perform).not.toHaveBeenCalled();
});
