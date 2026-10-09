import { test } from "node:test";
import assert from "node:assert/strict";
import {
  anonymousResources,
  anonymousToken,
} from "../../src/features/anonymous/anonymousModel.ts";
const session = "11111111-1111-4111-8111-111111111111";
function store() {
  const values = new Map();
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
}
let next = 0;
const uuid = () =>
  `11111111-1111-4111-8111-${String(++next).padStart(12, "0")}`;
test("anonymous resource credentials are secure chunks, restored across restart and isolated by session", async () => {
  const metadata = store(),
    secrets = store(),
    resources = anonymousResources(metadata, secrets, uuid);
  const token = "t".repeat(4096),
    entry = await resources.save(
      session,
      "music",
      "fixture-job",
      "Fictional tone",
      token,
    );
  assert.equal(entry.parts, 3);
  assert([...secrets.values.values()].every((chunk) => chunk.length <= 1800));
  assert(![...metadata.values.values()].join("").includes(token));
  const restored = anonymousResources(metadata, secrets, uuid);
  assert.equal(await restored.token(session, entry), token);
  await assert.rejects(
    () => restored.token("22222222-2222-4222-8222-222222222222", entry),
    /no longer retained/,
  );
  await restored.clear(session);
  assert.equal(secrets.values.size, 0);
  assert.equal(metadata.values.size, 0);
  assert.throws(() => anonymousToken("a,b"));
  assert.throws(() => anonymousToken("contains space"));
});
test("failed metadata commit removes new credential chunks while retaining the previous resource", async () => {
  const metadata = store(),
    secrets = store(),
    resources = anonymousResources(metadata, secrets, uuid);
  const first = await resources.save(
    session,
    "image",
    "fixture-job",
    "Fictional image",
    "original-token",
  );
  const commit = metadata.setItem;
  metadata.setItem = async () => {
    throw new Error("fictional write failure");
  };
  await assert.rejects(
    () =>
      resources.save(
        session,
        "image",
        "fixture-job",
        "Replacement",
        "replacement-token",
      ),
    /write failure/,
  );
  metadata.setItem = commit;
  assert.equal(await resources.token(session, first), "original-token");
  assert.equal(secrets.values.size, 1);
});
test("cleanup failure after committed replacement cannot delete the newly committed credential", async () => {
  const metadata = store(),
    secrets = store(),
    resources = anonymousResources(metadata, secrets, uuid);
  const first = await resources.save(
    session,
    "image",
    "fixture-job",
    "Fictional image",
    "original-token",
  );
  const remove = secrets.removeItem;
  secrets.removeItem = async (key) => {
    if (key.includes(first.credential))
      throw new Error("fictional cleanup failure");
    return remove(key);
  };
  await assert.rejects(
    () =>
      resources.save(
        session,
        "image",
        "fixture-job",
        "Replacement",
        "replacement-token",
      ),
    /cleanup failure/,
  );
  const [committed] = await resources.list(session);
  assert.equal(await resources.token(session, committed), "replacement-token");
  secrets.removeItem = remove;
  const restarted = anonymousResources(metadata, secrets, uuid);
  await restarted.clear(session);
  assert.equal(secrets.values.size, 0);
  assert.equal(metadata.values.size, 0);
});
