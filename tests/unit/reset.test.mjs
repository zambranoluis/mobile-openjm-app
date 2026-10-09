import { test } from "node:test";
import assert from "node:assert/strict";
import { resetToken } from "../../src/features/auth/resetModel.ts";
test("reset links extract only the token without fetching or accepting ambiguous input", () => {
  assert.equal(
    resetToken("https://example.test/reset-password?token=fictional_token"),
    "fictional_token",
  );
  assert.equal(
    resetToken("openjm://reset-password?token=fictional_token"),
    "fictional_token",
  );
  assert.equal(resetToken("fictional_token"), "fictional_token");
  for (const invalid of [
    "https://example.test/?token=a&token=b",
    "http://example.test/?token=a",
    "https://name:secret@example.test/?token=a",
    "https://example.test/?token=a#other",
    ["a", "b"],
  ])
    assert.equal(resetToken(invalid), null);
});
