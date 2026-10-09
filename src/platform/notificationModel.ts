export type NotificationTarget = {
  eventId: string;
  accountId: string;
  jobId: string;
  resourceType?: "response" | "image" | "video" | "music";
};
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function notificationProject(value: unknown): string | null {
  return typeof value === "string" && uuid.test(value) ? value : null;
}
export function notificationTarget(value: unknown): NotificationTarget | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (
    typeof data.eventId !== "string" ||
    !uuid.test(data.eventId) ||
    typeof data.accountId !== "string" ||
    !uuid.test(data.accountId) ||
    typeof data.jobId !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(data.jobId)
  )
    return null;
  if (
    data.resourceType !== undefined &&
    !["response", "image", "video", "music"].includes(String(data.resourceType))
  )
    return null;
  return {
    eventId: data.eventId,
    accountId: data.accountId,
    jobId: data.jobId,
    ...(data.resourceType
      ? {
          resourceType: data.resourceType as NotificationTarget["resourceType"],
        }
      : {}),
  };
}
export function notificationStatus(value: unknown): {
  available: boolean;
  registered: boolean;
} {
  if (!value || typeof value !== "object")
    throw new Error("Completion alert status could not be used.");
  const data = value as Record<string, unknown>;
  if (
    typeof data.available !== "boolean" ||
    typeof data.registered !== "boolean"
  )
    throw new Error("Completion alert status could not be used.");
  return { available: data.available, registered: data.registered };
}
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
export class NotificationInbox {
  private chain: Promise<unknown> = Promise.resolve();
  private readonly storage: Storage;
  constructor(storage: Storage) {
    this.storage = storage;
  }
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.chain.then(work, work);
    this.chain = result.catch(() => {});
    return result;
  }
  offer(value: unknown) {
    return this.serial(async () => {
      const target = notificationTarget(value);
      if (target)
        await this.storage.setItem(
          "openjm.alert.pending.v1",
          JSON.stringify(target),
        );
    });
  }
  consume(accountId: string): Promise<NotificationTarget | null> {
    return this.serial(async () => {
      const raw = await this.storage.getItem("openjm.alert.pending.v1");
      if (!raw) return null;
      let target: NotificationTarget | null = null;
      try {
        target = notificationTarget(JSON.parse(raw));
      } catch {
        /* Unusable local data is discarded. */
      }
      if (!target || target.accountId !== accountId) {
        await this.storage.removeItem("openjm.alert.pending.v1");
        return null;
      }
      const key = `openjm.alert.seen.v1.${accountId}`;
      let seen: string[] = [];
      try {
        const prior: unknown = JSON.parse(
          (await this.storage.getItem(key)) ?? "[]",
        );
        if (Array.isArray(prior))
          seen = prior
            .filter(
              (id): id is string => typeof id === "string" && uuid.test(id),
            )
            .slice(-63);
      } catch {
        /* Recover from invalid local metadata. */
      }
      if (seen.includes(target.eventId)) {
        await this.storage.removeItem("openjm.alert.pending.v1");
        return null;
      }
      await this.storage.setItem(
        key,
        JSON.stringify([...seen, target.eventId]),
      );
      // Keep the pending target if recording delivery fails. A failed cleanup remains deduplicated.
      await this.storage.removeItem("openjm.alert.pending.v1").catch(() => {});
      return target;
    });
  }
}
