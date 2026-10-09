import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Crypto from "expo-crypto";
import { api } from "./runtime";
const directory = () => new Directory(Paths.cache, "openjm-exports");
/** Export files stay private until the user chooses a share destination. */
export function clearExportFiles() {
  const folder = directory();
  if (!folder.exists) return;
  for (const file of folder.list()) {
    if (
      file instanceof File &&
      /^openjm-[a-f0-9-]+\.(json|zip|bin|pdf|txt|png|jpg|webp|gif|mp4|mp3|wav|flac)$/i.test(
        file.name,
      )
    )
      file.delete();
  }
}
export function cacheBinary(payload: {
  bytes: Uint8Array;
  contentType: string;
}) {
  if (!payload.bytes.length || payload.bytes.length > 24 * 1024 * 1024)
    throw new Error("The file cannot be shared on this device.");
  const extensions: Record<string, string> = {
    "application/zip": "zip",
    "application/json": "json",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/flac": "flac",
  };
  const extension = extensions[payload.contentType] ?? "bin";
  const folder = directory();
  folder.create({ intermediates: true, idempotent: true });
  const file = new File(folder, `openjm-${Crypto.randomUUID()}.${extension}`);
  file.create();
  file.write(payload.bytes);
  return file;
}
export async function shareBinary(payload: {
  bytes: Uint8Array;
  contentType: string;
}) {
  const revision = api.session.revision();
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable on this device.");
  if (revision !== api.session.revision())
    throw new Error("Your session changed before file sharing.");
  const file = cacheBinary(payload);
  await Sharing.shareAsync(file.uri, {
    mimeType: payload.contentType,
    dialogTitle: "Save or share OpenJM file",
  });
}
export async function shareJson(value: unknown) {
  const revision = api.session.revision();
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable on this device.");
  if (revision !== api.session.revision())
    throw new Error("Your session changed before file sharing.");
  const body = JSON.stringify(value, null, 2);
  if (!body || new TextEncoder().encode(body).length > 16 * 1024 * 1024)
    throw new Error("This export is too large to share from this device.");
  const folder = directory();
  folder.create({ intermediates: true, idempotent: true });
  const file = new File(folder, `openjm-${Crypto.randomUUID()}.json`);
  file.create();
  file.write(body);
  // Android receivers may still read after the chooser closes. Clear on logout/next cold launch.
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: "Save or share OpenJM export",
  });
}
