import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Row } from "../../ui/controls";
type Group = { id: string; name: string };
export function ConversationActions({
  id,
  groupId,
  disabled,
  onChanged,
}: {
  id: string;
  groupId?: string | null;
  disabled: boolean;
  onChanged: () => Promise<void>;
}) {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function choose() {
    if (disabled || busy) return;
    if (open) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const value = await api.request<unknown>("/v1/groups");
      if (
        !Array.isArray(value) ||
        value.some(
          (group) =>
            !group ||
            typeof group.id !== "string" ||
            typeof group.name !== "string",
        )
      )
        throw new Error("Conversation groups could not be used.");
      setGroups(value);
      setOpen(true);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not load groups.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function assign(group: string | null) {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.request(`/v1/conversations/${encodeURIComponent(id)}/group`, {
        method: "PATCH",
        body: JSON.stringify({ group_id: group }),
      });
      await onChanged();
      setOpen(false);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not change this conversation’s group.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.request(`/v1/conversations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      router.replace("/(tabs)");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Conversation deletion could not be confirmed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        label={open ? "Close conversation settings" : "Conversation settings"}
        secondary
        busy={busy}
        disabled={disabled}
        onPress={() => void choose()}
      />
      <Feedback message={error} />
      {open && (
        <>
          <Copy muted>Move this conversation into a group.</Copy>
          <Row
            localize
            title="No group"
            detail={!groupId ? "Current group" : undefined}
            onPress={() => void assign(null)}
          />
          {groups?.map((group) => (
            <Row
              key={group.id}
              title={group.name}
              detail={groupId === group.id ? "Current group" : undefined}
              onPress={() => void assign(group.id)}
            />
          ))}
          <Button
            label="Delete conversation"
            secondary
            disabled={busy || disabled}
            onPress={() =>
              Alert.alert(
                "Delete this conversation?",
                "This removes the saved conversation and its messages.",
                [
                  { text: "Keep conversation", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => void remove(),
                  },
                ],
              )
            }
          />
        </>
      )}
    </>
  );
}
