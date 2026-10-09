import { test } from "node:test";
import assert from "node:assert/strict";
import {
  balance,
  checkoutUrl,
  amountInCents,
} from "../../src/features/account/billingModel.ts";
test("billing has no invented balance or currency; integer amounts preserve cents", () => {
  assert.deepEqual(balance({}), { cents: null, credits: null, currency: null });
  assert.deepEqual(
    balance({ summary: { balance_cents: 123, currency: "eur" } }),
    { cents: 123, credits: null, currency: "eur" },
  );
  assert.equal(amountInCents("1.01"), 101);
  assert.equal(amountInCents("12.3"), 1230);
  for (const value of [
    "0",
    "-1",
    "1.111",
    "Infinity",
    "1e3",
    "9999999999999999",
  ])
    assert.throws(() => amountInCents(value));
});
test("checkout only accepts HTTPS and never grants account state", () => {
  assert.equal(
    checkoutUrl({ checkout_url: "https://checkout.example.test/session" }),
    "https://checkout.example.test/session",
  );
  for (const value of [
    "http://example.test",
    "javascript:alert(1)",
    "https://user:secret@example.test",
  ])
    assert.throws(() => checkoutUrl({ url: value }));
  assert.throws(() => checkoutUrl({ status: "success" }));
});
