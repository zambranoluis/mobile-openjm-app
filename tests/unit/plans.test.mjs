import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planCatalog,
  giftCardCode,
  currentPlan,
} from "../../src/features/account/planModel.ts";
test("plan purchases need authoritative availability, price, currency and mapped endpoint", () => {
  const plan = {
    tier: "pro",
    name: "Pro",
    price_cents: 1000,
    currency: "usd",
    purchasable: true,
    purchase_endpoint: "/v1/me/plan/purchase",
  };
  const [valid] = planCatalog({ plans: [plan] });
  assert.equal(valid.purchasable, true);
  assert.equal(valid.currency, "USD");
  for (const change of [
    { currency: null },
    { price_cents: 1.5 },
    { price_cents: -1 },
    { purchasable: false },
    { purchase_endpoint: "https://other.example" },
  ])
    assert.equal(
      planCatalog({ plans: [{ ...plan, ...change }] })[0].purchasable,
      false,
    );
  assert.equal(
    planCatalog({ plans: [plan, plan, { tier: "unknown" }] }).length,
    1,
  );
  assert.throws(() => planCatalog(null));
});
test("gift codes normalize permitted ambiguities without silently truncating input", () => {
  assert.equal(giftCardCode("abcd-efgh-0123"), "ABCDEFGH0123");
  assert.equal(giftCardCode("abcd efgh oil0"), "ABCDEFGH0110");
  assert.throws(() => giftCardCode("ABCD-EFGH-01234"));
  assert.throws(() => giftCardCode("ABCD-EFGH-U123"));
  assert.equal(
    currentPlan({ tier: "regular", status: "grace" }).status,
    "grace",
  );
});
