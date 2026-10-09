import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionManager } from "../../src/api/session.ts";
import { drafts } from "../../src/platform/drafts.ts";
const value = {
  accessToken: "fictional-access",
  refreshToken: "fictional-refresh",
  userId: "account-1",
  accessTokenExpiresAt: new Date(Date.now() + 600000).toISOString(),
  sessionExpiresAt: new Date(Date.now() + 86400000).toISOString(),
};
function storage() {
  let token = "fixture-old";
  return {
    read: async () => token,
    write: async (next) => {
      token = next;
    },
    remove: async () => {
      token = null;
    },
  };
}
test("refresh attempts serialize and persist rotated token before exposing access", async () => {
  let calls = 0;
  const store = storage();
  const manager = new SessionManager(store, async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return value;
  });
  const results = await Promise.all([
    manager.access(),
    manager.access(),
    manager.access(),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(results, Array(3).fill(value.accessToken));
  assert.equal(await store.read(), value.refreshToken);
});
test("logout during refresh cannot resurrect credentials", async () => {
  let release;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const store = storage();
  const manager = new SessionManager(store, async () => {
    await waiting;
    return value;
  });
  const pending = manager.refresh();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await manager.clear();
  release();
  await assert.rejects(pending);
  assert.equal(manager.snapshot(), null);
  assert.equal(await store.read(), null);
});
test("failed secure persistence or refresh leaves no usable credential", async () => {
  const store = storage();
  store.write = async () => {
    throw new Error("secure storage unavailable");
  };
  const manager = new SessionManager(store, async () => value);
  await assert.rejects(manager.refresh());
  assert.equal(manager.snapshot(), null);
  assert.equal(await store.read(), null);
});
test("account and conversation drafts cannot collide", async () => {
  const data = new Map();
  const d = drafts({
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  });
  await d.write("account-a", "conversation-a", "first");
  await d.write("account-b", "conversation-a", "second");
  assert.equal(await d.read("account-a", "conversation-a"), "first");
  assert.equal(await d.read("account-b", "conversation-a"), "second");
  assert.equal(await d.read("account-a", "conversation-b"), null);
});
