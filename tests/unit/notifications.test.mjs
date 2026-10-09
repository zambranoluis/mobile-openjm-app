import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NotificationInbox,
  notificationTarget,
  notificationStatus,
} from "../../src/platform/notificationModel.ts";
const event = {
  eventId: "12345678-1234-4321-9876-123456789abc",
  accountId: "12345678-1234-4321-9876-123456789def",
  jobId: "fixture-job",
};
function store() {
  const data = new Map();
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}
test("alert links accept only account-bound identifiers, never arbitrary URLs", () => {
  assert.deepEqual(
    notificationTarget({ ...event, url: "https://unexpected.example" }),
    event,
  );
  assert.equal(
    notificationTarget({ ...event, jobId: "../other-account" }),
    null,
  );
  assert.equal(notificationTarget({ ...event, accountId: "other" }), null);
  assert.throws(() =>
    notificationStatus({ available: "true", registered: true }),
  );
});
test("cold-start targets wait for authentication and duplicate taps open once", async () => {
  const storage = store();
  let inbox = new NotificationInbox(storage);
  await inbox.offer(event);
  inbox = new NotificationInbox(storage);
  assert.deepEqual(await inbox.consume(event.accountId), event);
  await inbox.offer(event);
  assert.equal(await inbox.consume(event.accountId), null);
});
test("different accounts cannot consume an alert and parallel duplicate events are serialized", async () => {
  const inbox = new NotificationInbox(store());
  await inbox.offer(event);
  assert.equal(
    await inbox.consume("12345678-1234-4321-9876-123456789fff"),
    null,
  );
  await Promise.all([inbox.offer(event), inbox.offer(event)]);
  const targets = await Promise.all([
    inbox.consume(event.accountId),
    inbox.consume(event.accountId),
  ]);
  assert.equal(targets.filter(Boolean).length, 1);
});

test("a failed delivery-record write preserves the pending link for the next authenticated attempt", async () => {
  const storage = store(),
    write = storage.setItem;
  let fail = true;
  storage.setItem = async (key, value) => {
    if (fail && key.includes(".seen."))
      throw new Error("Fictional storage interruption");
    await write(key, value);
  };
  const inbox = new NotificationInbox(storage);
  await inbox.offer(event);
  await assert.rejects(inbox.consume(event.accountId));
  fail = false;
  assert.deepEqual(await inbox.consume(event.accountId), event);
  await inbox.offer(event);
  assert.equal(await inbox.consume(event.accountId), null);
});
