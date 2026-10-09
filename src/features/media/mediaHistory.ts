import { mediaKind } from "./mediaModel.ts";
import type { MediaKind } from "./mediaModel.ts";
import { resourceId } from "../apps/appModel.ts";
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};
export type MediaRecord = {
  kind: MediaKind;
  id: string;
  conversationId: string;
  createdAt: string;
};
export function mediaHistory(storage: Storage) {
  let chain: Promise<unknown> = Promise.resolve();
  const key = (account: string) => `openjm.media.v1.${resourceId(account)}`;
  async function read(account: string): Promise<MediaRecord[]> {
    const raw = await storage.getItem(key(account));
    if (!raw) return [];
    const items: unknown = JSON.parse(raw);
    if (!Array.isArray(items))
      throw new Error("Saved media history could not be read.");
    return items.slice(0, 100).flatMap((value) => {
      try {
        const item = value as MediaRecord;
        return [
          {
            kind: mediaKind(item.kind),
            id: resourceId(item.id),
            conversationId: resourceId(item.conversationId),
            createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
          },
        ];
      } catch {
        return [];
      }
    });
  }
  function save(account: string, item: MediaRecord) {
    const work = chain.then(async () => {
      const prior = await read(account);
      await storage.setItem(
        key(account),
        JSON.stringify(
          [
            item,
            ...prior.filter(
              (value) => value.kind !== item.kind || value.id !== item.id,
            ),
          ].slice(0, 100),
        ),
      );
    });
    chain = work.catch(() => {});
    return work;
  }
  return { read, save };
}
