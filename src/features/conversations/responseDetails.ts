import type { Message, ResponseFile } from "../../api/types.ts";
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
const text = (value: unknown) => typeof value === "string" ? value : null;

/** Preserve actual DTO fields; malformed optional detail never invents a value. */
export function responseDetails(message: Message) {
  const raw = record(message);
  let incomplete = false;
  const files = (snake: string, camel: string): ResponseFile[] => {
    const field = raw[snake] ?? raw[camel];
    if (field == null) return [];
    if (!Array.isArray(field)) { incomplete = true; return []; }
    return field.flatMap((value) => {
      const file = record(value);
      const id = text(file.file_id ?? file.fileId), name = text(file.filename);
      if (!id || !name) { incomplete = true; return []; }
      return [{ file_id: id, filename: name, content_type: text(file.content_type ?? file.contentType) ?? undefined,
        bytes: number(file.bytes) ?? undefined, purpose: text(file.purpose) ?? undefined }];
    });
  };
  const quoteField = raw.quotes;
  const quotes = Array.isArray(quoteField) ? quoteField.flatMap((value) => {
    const quote = record(value);
    if ([quote.source, quote.excerpt, quote.reference].some((field) => typeof field !== "string")) { incomplete = true; return []; }
    return [{ source: quote.source as string, excerpt: quote.excerpt as string, reference: quote.reference as string }];
  }) : [];
  if (quoteField != null && !Array.isArray(quoteField)) incomplete = true;
  const usage = record(raw.token_usage ?? raw.tokenUsage);
  const result = {
    thinking: text(raw.thinking), quotes,
    usage: { entry: number(usage.entry), output: number(usage.output), total: number(usage.total) },
    duration: number(raw.work_duration_ms ?? raw.workDurationMs),
    images: files("image_attachments", "imageAttachments"),
    documents: files("document_attachments", "documentAttachments"),
    context: files("context_files", "contextFiles"),
    generated: files("generated_files", "generatedFiles"),
    processing: text(raw.attachment_processing_state ?? raw.attachmentProcessingState),
  };
  return { ...result, incomplete };
}

// The producer supports think/answer tags plus independent reasoning deltas.
// Hold incomplete tag prefixes during streaming instead of showing markup as an answer.
export function structuredResponse(raw: string, reasoning = "", streaming = false) {
  let thinking = reasoning;
  let content = raw.replace(/<think>([\s\S]*?)<\/think>/gi, (_whole, value: string) => { if (!reasoning) thinking += value; return ""; });
  const open = content.toLowerCase().lastIndexOf("<think>");
  if (open >= 0 && content.toLowerCase().indexOf("</think>", open) < 0) {
    if (!reasoning) thinking += content.slice(open + 7);
    content = content.slice(0, open);
  }
  content = content.replace(/<\/?answer>/gi, "");
  if (streaming) content = content.replace(/<(?:\/?(?:t(?:h(?:i(?:n(?:k)?)?)?)?|a(?:n(?:s(?:w(?:e(?:r)?)?)?)?)?))?$/i, "");
  return { content: content.trim(), thinking: thinking.trim() };
}
