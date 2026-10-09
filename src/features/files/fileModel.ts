import { asRecord, asText, resourceId } from "../apps/appModel.ts";
export type SavedFile = {
  id: string;
  name: string;
  contentType: string | null;
  bytes: number | null;
  expiresAt: string | null;
  purpose: string | null;
};
export function savedFile(value: unknown): SavedFile {
  const raw = asRecord(value);
  const metadata = asRecord(raw.openjm),
    expiry = raw.expires_at ?? metadata.expires_at;
  return {
    id: resourceId(raw.file_id ?? raw.id),
    name: asText(raw.filename) ?? "File",
    contentType: asText(raw.content_type ?? metadata.content_type),
    bytes:
      typeof raw.bytes === "number" &&
      Number.isSafeInteger(raw.bytes) &&
      raw.bytes >= 0
        ? raw.bytes
        : null,
    expiresAt:
      typeof expiry === "number" &&
      Number.isFinite(expiry) &&
      expiry > 0 &&
      expiry < 8640000000000
        ? new Date(expiry * 1000).toISOString()
        : asText(expiry),
    purpose: asText(raw.purpose),
  };
}
export function uploadPurpose(name: string, bytes: number) {
  const extension = name.split(".").pop()?.toLowerCase(),
    image = ["png", "jpg", "jpeg", "webp", "gif"].includes(extension ?? "");
  if (
    !image &&
    ![
      "csv",
      "docx",
      "json",
      "markdown",
      "md",
      "pdf",
      "pptx",
      "txt",
      "xlsx",
    ].includes(extension ?? "")
  )
    throw new Error("Choose a supported image or document.");
  if (bytes < 1 || bytes > (image ? 8 : 24) * 1024 * 1024)
    throw new Error(
      image
        ? "Choose an image no larger than 8 MiB."
        : "Choose a document no larger than 24 MiB.",
    );
  return image ? "vision" : "user_data";
}
export function savedFiles(value: unknown) {
  const raw = asRecord(value),
    list = Array.isArray(value) ? value : raw.data;
  if (!Array.isArray(list)) throw new Error("Saved files could not be read.");
  return list.map(savedFile);
}
export function downloadLink(value: unknown) {
  const raw = asRecord(value),
    link = asText(raw.url ?? raw.download_url);
  if (!link) throw new Error("A download address was not supplied.");
  const url = new URL(link);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("The download address could not be used safely.");
  return { url: url.toString(), expiresAt: asText(raw.expires_at) };
}
