import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { api } from "./runtime";
import { uploadPurpose } from "../features/files/fileModel";
export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "document";
};
export async function pickAttachment(
  onUploadStarted: (controller: AbortController) => void,
): Promise<Attachment | null> {
  const selected = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (selected.canceled) return null;
  const asset = selected.assets[0];
  const file = new File(asset.uri);
  // Leave room for multipart framing inside the gateway's 25 MiB limit.
  const purpose = uploadPurpose(asset.name, file.size);
  const form = new FormData();
  form.append("file", file, asset.name);
  form.append("purpose", purpose);
  // Choosing a file temporarily backgrounds the app; only the actual upload is cancellable.
  const controller = new AbortController();
  onUploadStarted(controller);
  if (controller.signal.aborted) return null;
  const uploaded = await api.request<{ id?: string; file_id?: string }>(
    "/v1/files",
    { method: "POST", body: form, signal: controller.signal },
  );
  const id = uploaded.id ?? uploaded.file_id;
  if (
    !id ||
    !/^(?:file_[A-Za-z0-9_-]+|[0-9A-Fa-f]{8}-(?:[0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12})$/.test(
      id,
    )
  )
    throw new Error("The uploaded file could not be attached.");
  return {
    id,
    name: asset.name,
    kind: purpose === "vision" ? "image" : "document",
  };
}
