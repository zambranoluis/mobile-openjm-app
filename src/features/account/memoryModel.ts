import { asRecord, asText, resourceId } from "../apps/appModel.ts";
export type MemoryItem = {
  id: string;
  content: string;
  kind: string | null;
  salience: number | null;
  score: number | null;
  createdAt: string | null;
};
export function memoryItem(value: unknown): MemoryItem {
  const raw = asRecord(value);
  if (typeof raw.content !== "string")
    throw new Error("Saved memory content could not be read.");
  const number = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  return {
    id: resourceId(raw.id ?? raw.item_id ?? raw.itemId),
    content: raw.content,
    kind: asText(raw.kind),
    salience: number(raw.salience),
    score: number(raw.score),
    createdAt: asText(raw.created_at ?? raw.createdAt),
  };
}
export function memories(value: unknown) {
  const raw = asRecord(value),
    source = raw.items ?? raw.results;
  if (!Array.isArray(source))
    throw new Error("The saved memory list could not be read.");
  return [
    ...new Map(
      source.map((item) => {
        const memory = memoryItem(item);
        return [memory.id, memory] as const;
      }),
    ).values(),
  ];
}
export function memoryWrite(content: string, kind: string, salience: string) {
  if (!content.trim()) throw new Error("Enter memory content before saving.");
  if (!["semantic", "episodic", "procedural"].includes(kind))
    throw new Error("Choose a supported memory kind.");
  const value = salience.trim();
  if (value && !Number.isFinite(Number(value)))
    throw new Error("Salience must be a number or left blank.");
  return {
    content: content.trim(),
    kind,
    ...(value ? { salience: Number(value) } : {}),
  };
}
export function memoryGraph(value: unknown) {
  const raw = asRecord(value);
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges))
    throw new Error("Memory connections could not be read.");
  return { nodes: raw.nodes.map(asRecord), edges: raw.edges.map(asRecord) };
}
export function graphQuery(k: string, similarity: string) {
  const params = new URLSearchParams();
  if (k.trim()) {
    if (!/^\d{1,2}$/.test(k.trim()) || Number(k) < 1 || Number(k) > 50)
      throw new Error("Choose between 1 and 50 neighbors.");
    params.set("k", String(Number(k)));
  }
  if (similarity.trim()) {
    const value = Number(similarity);
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error("Minimum similarity must be between 0 and 1.");
    params.set("min_similarity", String(value));
  }
  return params;
}
