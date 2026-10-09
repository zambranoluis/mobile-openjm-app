import { test } from "node:test";
import assert from "node:assert/strict";
import { MobileClient } from "../../src/api/client.ts";
const credentials = {
  accessToken: "fictional-access",
  refreshToken: "fictional-refresh",
  userId: "fixture-user",
  accessTokenExpiresAt: "2027-01-01T00:00:00Z",
  sessionExpiresAt: "2027-01-02T00:00:00Z",
};
test("a failed secure-store removal still attempts server revocation and reports its device limit", async () => {
  let revocations = 0;
  const api = new MobileClient(
    "https://mobile.example.test",
    async () => "fixture-install",
    {
      read: async () => null,
      write: async () => {},
      remove: async () => {
        throw new Error("locked secure store");
      },
    },
    async (_url, options) => {
      revocations++;
      assert.equal(
        JSON.parse(options.body).refreshToken,
        credentials.refreshToken,
      );
      assert.equal(options.headers.has("authorization"), false);
      return new Response(null, { status: 204 });
    },
  );
  await api.session.accept(credentials);
  await assert.rejects(api.logout(), { code: "DEVICE_SIGNOUT_FAILED" });
  assert.equal(revocations, 1);
  assert.equal(api.session.snapshot(), null);
  await assert.rejects(api.request("/v1/me"), { code: "AUTH_REQUIRED" });
  assert.equal(revocations, 1);
});
test("retry sign-out retains only the pending server credential and completes after connectivity returns", async () => {
  let online = false,
    calls = 0;
  const api = new MobileClient(
    "https://mobile.example.test",
    async () => "fixture-install",
    {
      read: async () => null,
      write: async () => {},
      remove: async () => {},
    },
    async (_url, options) => {
      calls++;
      assert.equal(
        JSON.parse(options.body).refreshToken,
        credentials.refreshToken,
      );
      if (!online) throw new Error("offline");
      return new Response(null, { status: 204 });
    },
  );
  await api.session.accept(credentials);
  await assert.rejects(api.logout(), { code: "REVOCATION_UNCONFIRMED" });
  online = true;
  await Promise.all([api.logout(), api.logout()]);
  assert.equal(calls, 2);
  await api.logout();
  assert.equal(calls, 2);
});
test("signing in after an unconfirmed logout does not lose revocation of the next session", async () => {
  let online = false;
  const seen = [];
  const api = new MobileClient(
    "https://mobile.example.test",
    async () => "fixture-install",
    { read: async () => null, write: async () => {}, remove: async () => {} },
    async (_url, options) => {
      const token = JSON.parse(options.body).refreshToken;
      seen.push(token);
      if (!online) throw new Error("offline");
      return new Response(null, { status: 204 });
    },
  );
  await api.session.accept(credentials);
  await assert.rejects(api.logout());
  await api.session.accept({
    ...credentials,
    refreshToken: "second-fictional-refresh",
  });
  online = true;
  await api.logout();
  assert.deepEqual(seen, [
    "fictional-refresh",
    "fictional-refresh",
    "second-fictional-refresh",
  ]);
});
test("offline server revocation clears local storage and reports only the unconfirmed server state", async () => {
  let removed = false;
  const api = new MobileClient(
    "https://mobile.example.test",
    async () => "fixture-install",
    {
      read: async () => null,
      write: async () => {},
      remove: async () => {
        removed = true;
      },
    },
    async () => {
      throw new Error("offline");
    },
  );
  await api.session.accept(credentials);
  await assert.rejects(api.logout(), { code: "REVOCATION_UNCONFIRMED" });
  assert.equal(removed, true);
  assert.equal(api.session.snapshot(), null);
});
