export type DraftStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
export function draftKey(account: string, conversation: string) {
  if (!account || !conversation) throw new Error("Draft identity is required");
  return `openjm.draft.v1:${encodeURIComponent(account)}:${encodeURIComponent(conversation)}`;
}
export function drafts(store: DraftStore) {
  return {
    read: (account: string, conversation: string) =>
      store.getItem(draftKey(account, conversation)),
    write: (account: string, conversation: string, value: string) =>
      value
        ? store.setItem(draftKey(account, conversation), value)
        : store.removeItem(draftKey(account, conversation)),
  };
}
