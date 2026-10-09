import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import type { Conversation } from "../../api/types";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Row,
  Screen,
  Title,
} from "../../ui/controls";

export function HistoryScreen({ groupId }: { groupId?: string } = {}) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState<string | null>(null);
  const generation = useRef(0);
  const load = useCallback(
    async (next?: string) => {
      const request = ++generation.current;
      setBusy(true);
      try {
        if (groupId) {
          const group = await api.request<{ id: unknown; name: unknown }>(
            `/v1/groups/${encodeURIComponent(groupId)}`,
          );
          if (group.id !== groupId || typeof group.name !== "string")
            throw new Error("The group could not be used.");
          if (request === generation.current) setGroupName(group.name);
        }
        const data = await api.request<{
          data: Conversation[];
          next_cursor: string | null;
        }>(
          `/v1/conversations?limit=30${next ? `&cursor=${encodeURIComponent(next)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}${groupId ? `&group_id=${encodeURIComponent(groupId)}` : ""}`,
        );
        if (!Array.isArray(data.data))
          throw new Error("Conversation history could not be used.");
        if (next && data.next_cursor === next)
          throw new Error("Conversation pagination did not advance.");
        if (request !== generation.current) return;
        setItems((old) =>
          next
            ? [
                ...new Map(
                  [...old, ...data.data].map((item) => [item.id, item]),
                ).values(),
              ]
            : data.data,
        );
        setCursor(data.next_cursor);
        setError(null);
      } catch (failure) {
        if (request === generation.current)
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not load conversations.",
          );
      } finally {
        if (request === generation.current) setBusy(false);
      }
    },
    [q, groupId],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        generation.current++;
      };
    }, [load]),
  );
  return (
    <Screen>
      <Title localize>Conversations</Title>
      {groupName && <Copy>{groupName}</Copy>}
      {!groupId ? (
        <Button
          label="Conversation groups"
          secondary
          onPress={() => router.push("/groups")}
        />
      ) : null}
      <Button
        label="New conversation"
        onPress={() => router.push("/conversation/new")}
      />
      <Field
        label="Search conversations"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        onSubmitEditing={() => setQ(search.trim())}
      />
      {!groupId && (
        <>
          <Button
            label="Response jobs"
            secondary
            onPress={() => router.push("/response-jobs")}
          />
          <Button
            label="Embeddings"
            secondary
            onPress={() => router.push("/embeddings")}
          />
        </>
      )}
      <Button label="Search" secondary onPress={() => setQ(search.trim())} />
      <Feedback message={error} />
      {busy && !items.length ? <Copy muted>Loading conversations…</Copy> : null}
      {!busy && !items.length && !error ? (
        <Copy muted>
          Your conversations will appear here. Start one when you’re ready.
        </Copy>
      ) : null}
      {items.map((item) => (
        <Row
          key={item.id}
          title={item.title || "Untitled conversation"}
          detail={item.preview || item.model || undefined}
          onPress={() =>
            router.push({
              pathname: "/conversation/[id]",
              params: { id: item.id },
            })
          }
        />
      ))}
      {cursor ? (
        <Button
          label="Load more"
          secondary
          busy={busy}
          onPress={() => void load(cursor)}
        />
      ) : null}
      {error ? (
        <Button
          label="Retry"
          secondary
          busy={busy}
          onPress={() => void load()}
        />
      ) : null}
    </Screen>
  );
}
