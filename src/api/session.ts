import { ApiFailure, credentials } from "./types.ts";
import type { Credentials } from "./types.ts";

export type CredentialStore = {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  remove(): Promise<void>;
};
type Refresh = (refreshToken: string) => Promise<unknown>;

export class SessionManager {
  private current: Credentials | null = null;
  private pending: Promise<Credentials> | null = null;
  private writes: Promise<void> = Promise.resolve();
  private epoch = 0;
  private signedOut = false;
  private store: CredentialStore;
  private refreshRequest: Refresh;
  constructor(store: CredentialStore, refreshRequest: Refresh) {
    this.store = store;
    this.refreshRequest = refreshRequest;
  }
  snapshot() {
    return this.current;
  }
  revision() {
    return this.epoch;
  }
  private enqueue(work: () => Promise<void>) {
    const next = this.writes.catch(() => {}).then(work);
    this.writes = next;
    return next;
  }
  async accept(value: unknown, expected = this.epoch) {
    const next = credentials(value);
    await this.enqueue(async () => {
      if (expected !== this.epoch)
        throw new ApiFailure(
          401,
          "SESSION_CHANGED",
          "The session changed. Please sign in again.",
        );
      await this.store.write(next.refreshToken);
      if (expected !== this.epoch) return;
      this.current = next;
      this.signedOut = false;
    });
    return next;
  }
  async refresh() {
    if (this.signedOut)
      throw new ApiFailure(401, "AUTH_REQUIRED", "Please sign in.");
    if (this.pending) return this.pending;
    const expected = this.epoch;
    const task = (async () => {
      await this.writes;
      if (this.signedOut)
        throw new ApiFailure(401, "AUTH_REQUIRED", "Please sign in.");
      const token = this.current?.refreshToken ?? (await this.store.read());
      if (!token) throw new ApiFailure(401, "AUTH_REQUIRED", "Please sign in.");
      try {
        return await this.accept(await this.refreshRequest(token), expected);
      } catch (failure) {
        // A refresh may have rotated remotely even if its response was lost; never reuse blindly.
        if (expected === this.epoch) await this.clear();
        throw failure;
      }
    })();
    this.pending = task;
    try {
      return await task;
    } finally {
      if (this.pending === task) this.pending = null;
    }
  }
  async access() {
    if (
      !this.current ||
      Date.parse(this.current.accessTokenExpiresAt) - Date.now() < 30_000
    )
      await this.refresh();
    if (!this.current)
      throw new ApiFailure(401, "AUTH_REQUIRED", "Please sign in.");
    return this.current.accessToken;
  }
  async clear() {
    this.epoch++;
    this.signedOut = true;
    this.current = null;
    await this.enqueue(() => this.store.remove());
  }
}
