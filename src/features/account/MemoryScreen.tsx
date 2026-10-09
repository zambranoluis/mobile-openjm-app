import { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { pickArchive } from "../../platform/archives";
import { shareBinary, shareJson } from "../../platform/exports";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Screen,
  Title,
} from "../../ui/controls";
import { useFeatureTask } from "../../ui/useFeatureTask";
import { asRecord, asText, resourceId } from "../apps/appModel";
import { SensitiveAction } from "./SensitiveAction";
import {
  graphQuery,
  memories,
  memoryGraph,
  memoryItem,
  memoryWrite,
} from "./memoryModel";
import type { MemoryItem } from "./memoryModel";
export function MemoryScreen() {
  const [items, setItems] = useState<MemoryItem[]>([]),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("");
  const [content, setContent] = useState(""),
    [writeKind, setWriteKind] = useState("semantic"),
    [salience, setSalience] = useState("");
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null),
    [notice, setNotice] = useState<string | null>(null);
  const [graph, setGraph] = useState<ReturnType<typeof memoryGraph> | null>(
      null,
    ),
    [neighbors, setNeighbors] = useState<MemoryItem[] | null>(null);
  const [k, setK] = useState(""),
    [similarity, setSimilarity] = useState(""),
    [section, setSection] = useState<"list" | "write" | "graph" | "transfer">(
      "list",
    );
  const [deleting, setDeleting] = useState<string | "all" | null>(null);
  const { run, busy, error } = useFeatureTask();
  const load = useCallback(
    () =>
      run(
        async (signal) => {
          const [list, usage] = await Promise.all([
            api.request("/v1/memory", { signal }),
            api.request("/v1/memory/usage", { signal }),
          ]);
          return { items: memories(list), usage: asRecord(usage) };
        },
        (value) => {
          setItems(value.items);
          setUsage(value.usage);
          setNeighbors(null);
        },
      ),
    [run],
  );
  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
      return () => {
        setDeleting(null);
      };
    }, [load]),
  );
  async function search() {
    await run(async (signal) => {
      if (!query.trim()) throw new Error("Enter a search query.");
      const params = new URLSearchParams({
        q: query.trim(),
        limit: "50",
        ...(kind ? { kind } : {}),
      });
      return memories(
        await api.request(`/v1/memory/search?${params}`, { signal }),
      );
    }, setItems).catch(() => {});
  }
  async function write() {
    await run(
      (signal) =>
        api.request("/v1/memory", {
          method: "POST",
          signal,
          body: JSON.stringify(memoryWrite(content, writeKind, salience)),
        }),
      () => {
        setContent("");
        setSalience("");
        setNotice(
          "Memory creation confirmed by OpenJM. Reload the list to see it.",
        );
      },
    ).catch(() => {});
  }
  async function readGraph() {
    await run(
      async (signal) =>
        memoryGraph(
          await api.request(`/v1/memory/graph?${graphQuery(k, similarity)}`, {
            signal,
          }),
        ),
      setGraph,
    ).catch(() => {});
  }
  async function readNeighbors(id: string) {
    await run(async (signal) => {
      const params = graphQuery(k, "");
      const raw = asRecord(
        await api.request(`/v1/memory/${resourceId(id)}/neighbors?${params}`, {
          signal,
        }),
      );
      if (!Array.isArray(raw.neighbors))
        throw new Error("Related memories could not be read.");
      return raw.neighbors.map(memoryItem);
    }, setNeighbors).catch(() => {});
  }
  async function transfer(action: "json" | "archive" | "import") {
    await run(async (signal) => {
      if (action === "import") {
        const file = await pickArchive();
        if (!file) return null;
        if (signal.aborted) throw new Error("Import canceled.");
        const result = asRecord(
          await api.request("/v1/memory/import", {
            method: "POST",
            signal,
            headers: { "content-type": "application/zip" },
            body: file,
          }),
        );
        const counts = ["notes", "imported", "skipped"]
          .filter((key) => typeof result[key] === "number")
          .map((key) => `${result[key]} ${key}`);
        if (result.quota_reached === true || result.quotaReached === true)
          counts.push("Quota reached; some notes were not imported.");
        return (
          counts.join(" · ") || "Import confirmed; counts were not supplied."
        );
      }
      const result =
        action === "json"
          ? await api.request("/v1/memory/export?format=json", { signal })
          : await api.binary("/v1/memory/export?format=obsidian", { signal });
      if (signal.aborted) throw new Error("Export canceled.");
      if (action === "json") await shareJson(result);
      else await shareBinary(result as Awaited<ReturnType<typeof api.binary>>);
      return "The system share chooser opened. Completion depends on your chosen destination.";
    }, setNotice).catch(() => {});
  }
  async function remove() {
    if (!deleting) return;
    const target = deleting;
    await run(
      (signal) =>
        api.request(
          `/v1/memory${target === "all" ? "" : `/${resourceId(target)}`}`,
          { method: "DELETE", signal },
        ),
      () => {
        setItems((current) =>
          target === "all" ? [] : current.filter((item) => item.id !== target),
        );
        setNeighbors(null);
        setGraph(null);
        setDeleting(null);
        setNotice("Deletion confirmed by OpenJM. Reload to refresh usage.");
      },
    );
  }
  function askRemove(target: string | "all") {
    Alert.alert(
      target === "all"
        ? "Delete all saved memories?"
        : "Delete this saved memory?",
      "This permanently removes saved memory content from OpenJM.",
      [
        { text: "Keep memories", style: "cancel" },
        {
          text: "Continue to verification",
          style: "destructive",
          onPress: () => setDeleting(target),
        },
      ],
    );
  }
  function itemRow(item: MemoryItem) {
    return (
      <View key={item.id} style={{ gap: 8 }}>
        <Copy>{item.content}</Copy>
        <Copy muted>
          {[
            item.kind,
            item.salience !== null ? `Salience ${item.salience}` : null,
            item.score !== null ? `Score ${item.score}` : null,
            item.createdAt,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Copy>
        <Button
          label="Read related memories"
          secondary
          disabled={busy}
          onPress={() => void readNeighbors(item.id)}
        />
        <Button
          label="Delete this memory"
          secondary
          disabled={busy}
          onPress={() => askRemove(item.id)}
        />
      </View>
    );
  }
  return (
    <Screen>
      <Title localize>Saved memories</Title>
      <Copy muted>
        OpenJM owns your memory availability, limits and stored content.
      </Copy>
      <Feedback message={error} />
      {notice && <Copy>{notice}</Copy>}
      {usage && (
        <Copy muted>
          {[
            asText(usage.plan),
            ...[
              ["item_count", "Saved items"],
              ["max_items", "Item limit"],
              ["total_bytes", "Stored bytes"],
              ["max_bytes", "Byte limit"],
            ].flatMap(([key, label]) =>
              typeof usage[key] === "number" ? [`${label}: ${usage[key]}`] : [],
            ),
          ]
            .filter(Boolean)
            .join(" · ")}
        </Copy>
      )}
      {(["list", "write", "graph", "transfer"] as const).map((value) => (
        <Button
          key={value}
          label={`${section === value ? "Selected: " : ""}${{ list: "Search and browse memories", write: "Add a memory", graph: "Memory connections", transfer: "Import and export memories" }[value]}`}
          secondary
          disabled={busy}
          onPress={() => setSection(value)}
        />
      ))}
      {section === "list" && (
        <>
          <Field
            label="Search saved memories"
            value={query}
            onChangeText={setQuery}
            editable={!busy}
          />
          {["", "semantic", "episodic", "procedural"].map((value) => (
            <Button
              key={value}
              label={`${kind === value ? "Selected: " : ""}${value || "All memory kinds"}`}
              secondary
              disabled={busy}
              onPress={() => setKind(value)}
            />
          ))}
          <Button
            label="Search memories"
            busy={busy}
            onPress={() => void search()}
          />
          <Button
            label="Reload memory list and usage"
            secondary
            busy={busy}
            onPress={() => void load().catch(() => {})}
          />
          {!items.length && !busy && !error && (
            <Copy muted>No memories were returned.</Copy>
          )}
          {items.map(itemRow)}
          <Button
            label="Delete all saved memories"
            secondary
            disabled={busy}
            onPress={() => askRemove("all")}
          />
        </>
      )}
      {section === "write" && (
        <>
          <Field
            label="Memory content"
            multiline
            value={content}
            onChangeText={setContent}
            editable={!busy}
          />
          {["semantic", "episodic", "procedural"].map((value) => (
            <Button
              key={value}
              label={`${writeKind === value ? "Selected: " : ""}${value}`}
              secondary
              disabled={busy}
              onPress={() => setWriteKind(value)}
            />
          ))}
          <Field
            label="Salience (optional)"
            value={salience}
            onChangeText={setSalience}
            keyboardType="numbers-and-punctuation"
            editable={!busy}
          />
          <Button
            label="Save new memory"
            busy={busy}
            onPress={() => void write()}
          />
        </>
      )}
      {section === "graph" && (
        <>
          <Field
            label="Maximum neighbors (1–50, optional)"
            value={k}
            onChangeText={setK}
            keyboardType="number-pad"
            editable={!busy}
          />
          <Field
            label="Minimum similarity (0–1, optional)"
            value={similarity}
            onChangeText={setSimilarity}
            keyboardType="numbers-and-punctuation"
            editable={!busy}
          />
          <Button
            label="Load memory connections"
            busy={busy}
            onPress={() => void readGraph()}
          />
          {graph && (
            <>
              <Copy>
                {graph.nodes.length} nodes · {graph.edges.length} connections
              </Copy>
              {graph.nodes.map((node, index) => (
                <View key={index} style={{ gap: 8 }}>
                  <Copy>
                    {asText(node.content ?? node.label ?? node.id) ??
                      "Memory node"}
                  </Copy>
                  {asText(node.id) && (
                    <Button
                      label="Read node neighbors"
                      secondary
                      disabled={busy}
                      onPress={() => void readNeighbors(String(node.id))}
                    />
                  )}
                </View>
              ))}
              {graph.edges.map((edge, index) => (
                <Copy key={index}>
                  {[
                    asText(edge.source),
                    asText(edge.target),
                    typeof edge.similarity === "number"
                      ? `Similarity ${edge.similarity}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" → ") || "Connection metadata unavailable"}
                </Copy>
              ))}
            </>
          )}
        </>
      )}
      {section === "transfer" && (
        <>
          <Copy muted>
            Archives and JSON may contain private content. Choose a trusted
            share destination.
          </Copy>
          <Button
            label="Export memories as JSON"
            secondary
            busy={busy}
            onPress={() => void transfer("json")}
          />
          <Button
            label="Export memories as Obsidian archive"
            secondary
            busy={busy}
            onPress={() => void transfer("archive")}
          />
          <Button
            label="Import a memory archive"
            secondary
            busy={busy}
            onPress={() => void transfer("import")}
          />
        </>
      )}
      {neighbors && (
        <>
          <Title localize>Related memories</Title>
          {neighbors.length ? (
            neighbors.map(itemRow)
          ) : (
            <Copy muted>No neighbors were returned.</Copy>
          )}
        </>
      )}
      {deleting && (
        <SensitiveAction
          key={deleting}
          action={
            deleting === "all" ? "MEMORY_DELETE_ALL" : "MEMORY_ITEM_DELETE"
          }
          resourceId={deleting === "all" ? undefined : deleting}
          label={
            deleting === "all"
              ? "Verify and delete all memories"
              : "Verify and delete selected memory"
          }
          disabled={busy}
          perform={remove}
        />
      )}
    </Screen>
  );
}
