export type AnonymousKind = "file" | "image" | "music";
export type AnonymousResource = {
  kind: AnonymousKind;
  id: string;
  name: string;
  credential: string;
  parts: number;
};
const id = /^[A-Za-z0-9_-]{1,128}$/;
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function anonymousToken(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 4096 ||
    /[^\x21-\x7e]|,/.test(value)
  )
    throw new Error("The anonymous resource credential could not be used.");
  return value;
}
export function anonymousResource(value: unknown): AnonymousResource {
  if (!value || typeof value !== "object")
    throw new Error("The anonymous resource could not be used.");
  const raw = value as AnonymousResource;
  if (
    !["file", "image", "music"].includes(raw.kind) ||
    typeof raw.id !== "string" ||
    !id.test(raw.id) ||
    typeof raw.name !== "string" ||
    raw.name.length > 128 ||
    !uuid.test(raw.credential) ||
    !Number.isInteger(raw.parts) ||
    raw.parts < 1 ||
    raw.parts > 3
  )
    throw new Error("The anonymous resource could not be used.");
  return {
    kind: raw.kind,
    id: raw.id,
    name: raw.name,
    credential: raw.credential,
    parts: raw.parts,
  };
}
type Store = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};
/** Tokens use small secure chunks; ordinary metadata never includes a token. */
export function anonymousResources(
  metadata: Store,
  secrets: Store,
  newId: () => string,
) {
  let writes: Promise<unknown> = Promise.resolve();
  const key = (session: string) => {
    if (!uuid.test(session)) throw new Error("Invalid anonymous session.");
    return `openjm.anonymous.resources.${session}`;
  };
  const tokenKey = (session: string, entry: AnonymousResource, part: number) =>
    `${key(session)}.${entry.credential}.${part}`;
  async function list(session: string) {
    const raw = await metadata.getItem(key(session));
    if (!raw) return [];
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length > 50)
      throw new Error("Anonymous resource history could not be read.");
    return entries.map(anonymousResource);
  }
  async function remove(session: string, entry: AnonymousResource) {
    await Promise.all(
      Array.from({ length: entry.parts }, (_, part) =>
        secrets.removeItem(tokenKey(session, entry, part)),
      ),
    );
  }
  function serial<T>(work: () => Promise<T>) {
    const result = writes.then(work, work);
    writes = result.catch(() => {});
    return result;
  }
  const pendingKey = (session: string) => `${key(session)}.cleanup`;
  async function pending(session: string) {
    const values: unknown = JSON.parse(
      (await metadata.getItem(pendingKey(session))) ?? "[]",
    );
    if (!Array.isArray(values) || values.length > 102)
      throw new Error("Anonymous credential cleanup could not be read.");
    return values.map(anonymousResource);
  }
  async function cleanup(session: string, retained: AnonymousResource[]) {
    for (const entry of await pending(session))
      if (!retained.some((item) => item.credential === entry.credential))
        await remove(session, entry);
    await metadata.removeItem(pendingKey(session));
  }
  return {
    list,
    save: (
      session: string,
      kind: AnonymousKind,
      resourceId: string,
      name: string,
      value: unknown,
    ) =>
      serial(async () => {
        const token = anonymousToken(value),
          entry = anonymousResource({
            kind,
            id: resourceId,
            name: name.slice(0, 128),
            credential: newId(),
            parts: Math.ceil(token.length / 1800),
          });
        const prior = await list(session);
        await cleanup(session, prior);
        const retained = [
          entry,
          ...prior.filter(
            (item) => item.id !== entry.id || item.kind !== entry.kind,
          ),
        ].slice(0, 50);
        // Journal before writing secrets so interrupted writes can be reclaimed.
        await metadata.setItem(
          pendingKey(session),
          JSON.stringify([
            entry,
            ...prior.filter((item) => !retained.includes(item)),
          ]),
        );
        try {
          for (let part = 0; part < entry.parts; part++)
            await secrets.setItem(
              tokenKey(session, entry, part),
              token.slice(part * 1800, (part + 1) * 1800),
            );
          await metadata.setItem(key(session), JSON.stringify(retained));
        } catch (failure) {
          await cleanup(session, prior).catch(() => {});
          throw failure;
        }
        await cleanup(session, retained);
        return entry;
      }),
    token: async (session: string, entry: AnonymousResource) => {
      const current = (await list(session)).find(
        (item) =>
          item.credential === entry.credential &&
          item.id === entry.id &&
          item.kind === entry.kind,
      );
      if (!current)
        throw new Error("This anonymous resource is no longer retained.");
      let token = "";
      for (let part = 0; part < current.parts; part++) {
        const chunk = await secrets.getItem(tokenKey(session, current, part));
        if (chunk === null)
          throw new Error(
            "The anonymous credential is unavailable on this device.",
          );
        token += chunk;
      }
      return anonymousToken(token);
    },
    clear: (session: string) =>
      serial(async () => {
        await cleanup(session, []);
        for (const entry of await list(session)) await remove(session, entry);
        await metadata.removeItem(key(session));
      }),
  };
}
