import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createdKey,
  keyInput,
  keyPage,
  managedKey,
} from "../../src/features/account/keyModel.ts";
import {
  domainInput,
  domainState,
} from "../../src/features/account/domainModel.ts";
const limits = {
  rpm_limit: "",
  tpm_limit: "",
  daily_token_limit: "",
  daily_spend_limit_cents: "",
};
test("API keys preserve unknown state and require permissions, valid limits and a one-time secret", () => {
  const key = {
    id: "key-fixture",
    scopes: ["chat:write"],
    api_key: "fictional-once",
  };
  assert.equal(managedKey(key).revoked, null);
  assert.deepEqual(keyInput(["chat:write"], limits), {
    scopes: ["chat:write"],
  });
  assert.throws(() => keyInput([], limits));
  for (const rpm_limit of ["0", "-1", "2.5", "2147483648"])
    assert.throws(() => keyInput(["chat:write"], { ...limits, rpm_limit }));
  assert.equal(createdKey(key).secret, "fictional-once");
  assert.throws(() => createdKey({ ...key, api_key: null }));
  assert.throws(() => keyPage({ data: [key], has_more: true }));
  assert.throws(() =>
    keyPage(
      { data: [key], has_more: true, next_cursor: "same-page" },
      "same-page",
    ),
  );
});
test("domain names follow the Spring DNS-name boundary and only explicit verified status proves verification", () => {
  assert.equal(domainInput(" Example.TEST "), "example.test");
  assert.equal(domainInput("xn--bcher-kva.test"), "xn--bcher-kva.test");
  for (const value of [
    "https://example.test",
    "example.test/",
    "localhost",
    "-name.test",
    "a..test",
    "bücher.test",
    "a".repeat(64) + ".test",
  ])
    assert.throws(() => domainInput(value));
  const challenge = {
    domain: "example.test",
    challenge_id: "fixture",
    status: "pending",
    dns_record_value: "fictional-dns",
  };
  assert.equal(domainState(challenge).status, "pending");
  assert.equal(
    domainState({ ...challenge, status: "verified" }).status,
    "verified",
  );
  assert.throws(() => domainState({ ...challenge, status: "success" }));
});
