import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { api } from "../../platform/runtime";
import { pickArchive } from "../../platform/archives";
import { shareBinary } from "../../platform/exports";
import { Button, Copy, Field, Title } from "../../ui/controls";
import type { useFeatureTask } from "../../ui/useFeatureTask";
import { asRecord, asText } from "./appModel";
export function ObsidianPanel({
  id,
  task,
}: {
  id: string;
  task: ReturnType<typeof useFeatureTask>;
}) {
  const [token, setToken] = useState(""),
    [status, setStatus] = useState<string | null>(null),
    [result, setResult] = useState<string | null>(null);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") setToken("");
    });
    return () => listener.remove();
  }, []);
  function prefix() {
    return `/v1/apps/installations/${id}/obsidian`;
  }
  async function read() {
    await task
      .run(
        async (signal) =>
          asRecord(
            await api.request(`${prefix()}/status`, {
              method: "POST",
              signal,
              body: JSON.stringify({ installation_token: token.trim() }),
            }),
          ),
        (value) => {
          setStatus(
            [
              asText(value.status) ?? "Status unavailable",
              asText(value.detail),
              asText(value.vault ?? value.vault_name),
            ]
              .filter(Boolean)
              .join(" · "),
          );
        },
      )
      .catch(() => {});
  }
  async function archive(action: "import" | "export") {
    const credential = token.trim();
    await task
      .run(
        async (signal) => {
          if (action === "export") {
            const file = await api.binary(`${prefix()}/export`, {
              method: "POST",
              signal,
              body: JSON.stringify({ installation_token: credential }),
            });
            if (signal.aborted) throw new Error("Export canceled.");
            await shareBinary(file);
            return "The system share chooser opened. Completion depends on your chosen destination.";
          }
          const archive = await pickArchive();
          if (!archive) return null;
          if (signal.aborted) throw new Error("Import canceled.");
          const form = new FormData();
          form.append("installation_token", credential);
          form.append("archive", archive, "obsidian-import.zip");
          const payload = asRecord(
            await api.request(`${prefix()}/import`, {
              method: "POST",
              signal,
              body: form,
            }),
          );
          const parts = ["notes", "imported", "skipped"]
            .filter((key) => typeof payload[key] === "number")
            .map((key) => `${payload[key]} ${key}`);
          if (payload.quota_reached === true || payload.quotaReached === true)
            parts.push("Quota reached; some notes were not imported.");
          return (
            parts.join(" · ") ||
            "Import confirmed by OpenJM; counts were not supplied."
          );
        },
        (value) => setResult(value),
      )
      .catch(() => {});
  }
  return (
    <>
      <Title localize>Obsidian bridge</Title>
      <Copy muted>
        Use your installation token for bridge status and archive transfer. This
        token stays in memory and clears when the app backgrounds.
      </Copy>
      <Field
        label="Obsidian installation token"
        secureTextEntry
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!task.busy}
        maxLength={4096}
      />
      <Button
        label="Check Obsidian bridge"
        secondary
        busy={task.busy}
        disabled={!token.trim()}
        onPress={() => void read()}
      />
      {status && <Copy>{status}</Copy>}
      <Button
        label="Export Obsidian archive"
        secondary
        busy={task.busy}
        disabled={!token.trim()}
        onPress={() => void archive("export")}
      />
      <Button
        label="Import Obsidian archive"
        secondary
        busy={task.busy}
        disabled={!token.trim()}
        onPress={() => void archive("import")}
      />
      {result && <Copy>{result}</Copy>}
    </>
  );
}
