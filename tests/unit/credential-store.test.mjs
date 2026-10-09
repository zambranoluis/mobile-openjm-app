import { test } from "node:test";
import assert from "node:assert/strict";
import { guardedCredentials } from "../../src/api/credentialStore.ts";
test("a restart cannot restore credentials left behind by a failed SecureStore deletion", async () => {
  let secret = "fictional-old",
    marker = null;
  const credentials = {
    read: async () => secret,
    write: async (value) => {
      secret = value;
    },
    remove: async () => {
      throw new Error("Fictional secure deletion failure");
    },
  };
  const metadata = {
    read: async () => marker,
    write: async () => {
      marker = "1";
    },
    remove: async () => {
      marker = null;
    },
  };
  await assert.rejects(guardedCredentials(credentials, metadata).remove());
  const restarted = guardedCredentials(credentials, metadata);
  assert.equal(await restarted.read(), null);
  assert.equal(secret, "fictional-old");
  await restarted.write("fictional-new");
  assert.equal(await restarted.read(), "fictional-new");
});
test("unreadable sign-out metadata fails closed without reading a persisted credential", async () => {
  let reads = 0;
  const store = guardedCredentials(
    {
      read: async () => {
        reads++;
        return "fictional";
      },
      write: async () => {},
      remove: async () => {},
    },
    {
      read: async () => {
        throw new Error("Fictional metadata interruption");
      },
      write: async () => {},
      remove: async () => {},
    },
  );
  await assert.rejects(store.read());
  assert.equal(reads, 0);
});
