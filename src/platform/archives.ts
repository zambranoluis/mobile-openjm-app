import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
export async function pickArchive(): Promise<File | null> {
  const selected = await DocumentPicker.getDocumentAsync({
    type: ["application/zip", "application/octet-stream"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (selected.canceled) return null;
  const file = new File(selected.assets[0].uri);
  if (!file.size || file.size > 24 * 1024 * 1024)
    throw new Error("Choose an archive smaller than 24 MB.");
  return file;
}
