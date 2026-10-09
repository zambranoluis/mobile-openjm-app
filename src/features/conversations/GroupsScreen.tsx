import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Row,
  Screen,
  Title,
} from "../../ui/controls";
type Group = { id: string; name: string; description: string };
export function GroupsScreen() {
  const [items, setItems] = useState<Group[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const value = await api.request<Group[]>("/v1/groups");
      if (!Array.isArray(value)) throw new Error("Groups could not be loaded.");
      setItems(value);
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not load groups.",
      );
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  function clear() {
    setSelected(null);
    setName("");
    setDescription("");
  }
  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      await api.request(
        selected ? `/v1/groups/${encodeURIComponent(selected)}` : "/v1/groups",
        {
          method: selected ? "PATCH" : "POST",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        },
      );
      clear();
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not save group.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await api.request(`/v1/groups/${encodeURIComponent(selected)}`, {
        method: "DELETE",
      });
      clear();
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not remove group.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Title localize>Conversation groups</Title>
      <Feedback message={error} />
      {items.map((item) => (
        <Row
          key={item.id}
          title={item.name}
          detail={item.description}
          onPress={() => {
            if (!busy) {
              setSelected(item.id);
              setName(item.name);
              setDescription(item.description);
            }
          }}
        />
      ))}
      {!items.length ? (
        <Copy muted>
          Organize related conversations with a shared description.
        </Copy>
      ) : null}
      <Field
        label="Group name"
        value={name}
        onChangeText={setName}
        maxLength={160}
        editable={!busy}
      />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={8000}
        editable={!busy}
      />
      <Button
        label={selected ? "Save group" : "Create group"}
        busy={busy}
        disabled={!name.trim() || !description.trim()}
        onPress={() => void save()}
      />
      {selected ? (
        <>
          <Button
            label="View conversations"
            secondary
            disabled={busy}
            onPress={() =>
              router.push({ pathname: "/group/[id]", params: { id: selected } })
            }
          />
          <Button label="New group" secondary disabled={busy} onPress={clear} />
          <Button
            label="Delete group"
            secondary
            disabled={busy}
            onPress={() =>
              Alert.alert(
                "Delete group?",
                "Conversations remain in your history.",
                [
                  { text: "Cancel", style: "cancel" },
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
      ) : null}
      <Button
        label="Refresh groups"
        secondary
        disabled={busy}
        onPress={() => void load()}
      />
    </Screen>
  );
}
