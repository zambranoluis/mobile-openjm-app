import { test } from "node:test";
import assert from "node:assert/strict";
import {
  challenge,
  twoFactorStatus,
} from "../../src/features/account/securityModel.ts";
test("security state and verification expiry are validated before actionable UI", () => {
  assert.deepEqual(
    twoFactorStatus({ enabled: true, managedByUpstream: true, method: "TOTP" }),
    { enabled: true, managedByUpstream: true, method: "TOTP" },
  );
  assert.throws(() =>
    twoFactorStatus({
      enabled: "true",
      managedByUpstream: false,
      method: null,
    }),
  );
  assert.throws(() =>
    challenge({
      challengeId: "fixture",
      expiresAt: "unknown",
      resendAvailableAt: "2027-01-01",
    }),
  );
});
