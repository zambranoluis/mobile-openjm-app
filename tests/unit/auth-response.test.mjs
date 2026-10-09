import { test } from "node:test";
import assert from "node:assert/strict";
import { loginFlow, profile } from "../../src/api/types.ts";
const credentials = {
  accessToken: "fixture-access",
  refreshToken: "fixture-refresh",
  userId: "account-a",
  accessTokenExpiresAt: "2026-10-09T12:00:00Z",
  sessionExpiresAt: "2026-10-10T12:00:00Z",
};
test("MFA cannot establish a session and issued credentials must belong to the authenticated account", () => {
  assert.equal(
    loginFlow({
      flow: {
        nextStep: "OTP_REQUIRED",
        challenge: { challengeId: "fixture-challenge" },
      },
      credentials: null,
    }).credentials,
    null,
  );
  assert.throws(() =>
    loginFlow({
      flow: {
        nextStep: "OTP_REQUIRED",
        challenge: { challengeId: "fixture-challenge" },
      },
      credentials,
    }),
  );
  assert.throws(() =>
    loginFlow({
      flow: { nextStep: "AUTHENTICATED", login: { userId: "account-b" } },
      credentials,
    }),
  );
  assert.throws(() =>
    loginFlow({ flow: { nextStep: "UPSTREAM_TOTP_REQUIRED" } }),
  );
  assert.equal(
    loginFlow({
      flow: { nextStep: "AUTHENTICATED", login: { userId: "account-a" } },
      credentials,
    }).credentials.userId,
    "account-a",
  );
});
test("incomplete profile permits empty personal fields but never invents completion state", () => {
  const user = {
    id: "fixture-user",
    email: "fictional@example.test",
    name: null,
    lastname: null,
    profileComplete: false,
    missingFields: ["name", "lastname"],
    twoFactorEnabled: false,
  };
  assert.equal(profile(user).profileComplete, false);
  assert.throws(() => profile({ ...user, profileComplete: undefined }));
  assert.throws(() => profile({ ...user, missingFields: "none" }));
});
