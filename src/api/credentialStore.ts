import type { CredentialStore } from "./session.ts";
type Marker = {
  read(): Promise<string | null>;
  write(): Promise<void>;
  remove(): Promise<void>;
};
/** This marker contains no credential; it prevents restart from restoring a failed device sign-out. */
export function guardedCredentials(
  credentials: CredentialStore,
  marker: Marker,
): CredentialStore {
  return {
    async read() {
      if (await marker.read()) return null;
      return credentials.read();
    },
    async write(value) {
      await credentials.write(value);
      await marker.remove();
    },
    async remove() {
      const result = await Promise.allSettled([
        marker.write(),
        credentials.remove(),
      ]);
      const failure = result.find((value) => value.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
    },
  };
}
