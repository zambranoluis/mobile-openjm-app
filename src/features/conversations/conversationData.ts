import type { ConversationDetail, Message } from "../../api/types.ts";
export function conversationDetail(
  value: unknown,
  expectedId: string,
): ConversationDetail {
  if (!value || typeof value !== "object")
    throw new Error("Conversation could not be used.");
  const data = value as ConversationDetail;
  if (
    data.id !== expectedId ||
    !Array.isArray(data.messages) ||
    typeof data.has_more !== "boolean" ||
    (data.next_cursor !== null && typeof data.next_cursor !== "string") ||
    data.messages.some(
      (message) =>
        !message ||
        typeof message.id !== "string" ||
        typeof message.role !== "string" ||
        typeof message.content !== "string",
    )
  )
    throw new Error("Conversation could not be used.");
  if (data.has_more && !data.next_cursor)
    throw new Error("Conversation pagination could not be used.");
  return data;
}
export function prependMessages(
  older: Message[],
  current: Message[],
): Message[] {
  const latest = new Map(current.map((message) => [message.id, message]));
  const seen = new Set<string>();
  return [...older, ...current]
    .filter((message) => {
      if (seen.has(message.id)) return false;
      seen.add(message.id);
      return true;
    })
    .map((message) => latest.get(message.id) ?? message);
}
