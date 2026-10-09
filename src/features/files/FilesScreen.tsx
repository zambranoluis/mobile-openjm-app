import { useCallback, useState } from "react";
import { Alert, AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as WebBrowser from "expo-web-browser";
import { api } from "../../platform/runtime";
import { cacheBinary, shareBinary } from "../../platform/exports";
import { MediaPlayer } from "../../platform/MediaPlayer";
import type { MediaKind } from "../media/mediaModel";
import {
  Button,
  Copy,
  Feedback,
  Field,
  Row,
  Screen,
  Title,
} from "../../ui/controls";
import { useFeatureTask } from "../../ui/useFeatureTask";
import {
  downloadLink,
  savedFile,
  savedFiles,
  uploadPurpose,
} from "./fileModel";
import type { SavedFile } from "./fileModel";
export function FilesScreen({ conversationId }: { conversationId: string }) {
  const [items, setItems] = useState<SavedFile[]>([]),
    [selected, setSelected] = useState<SavedFile | null>(null),
    [lookup, setLookup] = useState("");
  const [preview, setPreview] = useState<{
      kind: MediaKind;
      uri: string;
    } | null>(null),
    [message, setMessage] = useState<string | null>(null);
  const { run, busy, error } = useFeatureTask();
  const load = useCallback(
    () =>
      run(
        async (signal) =>
          savedFiles(
            await api.request(
              `/v1/conversations/${encodeURIComponent(conversationId)}/files`,
              { signal },
            ),
          ),
        setItems,
      ),
    [run, conversationId],
  );
  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void load().catch(() => {});
      });
      return () => {
        listener.remove();
        setPreview(null);
      };
    }, [load]),
  );
  async function upload() {
    await run(
      async (signal) => {
        const choice = await DocumentPicker.getDocumentAsync({
          copyToCacheDirectory: true,
          multiple: false,
        });
        if (choice.canceled || signal.aborted) return null;
        const asset = choice.assets[0],
          file = new File(asset.uri);
        const body = new FormData();
        body.append("file", file, asset.name);
        body.append("purpose", uploadPurpose(asset.name, file.size));
        return savedFile(
          await api.request(
            `/v1/conversations/${encodeURIComponent(conversationId)}/files`,
            { method: "POST", signal, body },
          ),
        );
      },
      (value) => {
        if (value) {
          setSelected(value);
          setMessage(
            "Upload confirmed by OpenJM. Reload the library to refresh it.",
          );
        }
      },
    ).catch(() => {});
  }
  async function download(share = false) {
    if (!selected) return;
    await run(
      async (signal) => {
        const payload = await api.binary(`/v1/files/${selected.id}/content`, {
          signal,
        });
        if (share) {
          await shareBinary(payload);
          return null;
        }
        const kind: MediaKind | null = payload.contentType.startsWith("image/")
          ? "image"
          : payload.contentType.startsWith("video/")
            ? "video"
            : payload.contentType.startsWith("audio/")
              ? "music"
              : null;
        if (!kind)
          throw new Error("This file can be saved or shared with another app.");
        return { kind, uri: cacheBinary(payload).uri };
      },
      (value) => setPreview(value),
    ).catch(() => {});
  }
  return (
    <Screen>
      <Title localize>Conversation files</Title>
      <Feedback message={error} />
      {message && <Copy>{message}</Copy>}
      <Button
        label="Upload a file to this conversation"
        busy={busy}
        onPress={() => void upload()}
      />
      <Button
        label="Reload file library"
        secondary
        busy={busy}
        onPress={() => void load().catch(() => {})}
      />
      {items.map((item) => (
        <Row
          key={item.id}
          title={item.name}
          detail={`${item.contentType ?? "Unknown format"} · ${item.bytes ?? "Unknown size"} bytes`}
          onPress={() => {
            setSelected(item);
            setPreview(null);
            setMessage(null);
          }}
        />
      ))}
      {!items.length && <Copy muted>No associated files were supplied.</Copy>}
      <Field
        label="File identifier"
        value={lookup}
        onChangeText={setLookup}
        editable={!busy}
      />
      <Button
        label="Read file metadata"
        secondary
        busy={busy}
        disabled={!lookup.trim()}
        onPress={() =>
          void run(
            async (signal) => {
              const id = lookup.trim();
              if (!/^[A-Za-z0-9_-]{1,128}$/.test(id))
                throw new Error("Enter a valid file identifier.");
              return savedFile(
                await api.request(`/v1/files/${id}`, { signal }),
              );
            },
            (value) => {
              setSelected(value);
              setPreview(null);
            },
          ).catch(() => {})
        }
      />
      {selected && (
        <>
          <Title>{selected.name}</Title>
          <Copy>{selected.id}</Copy>
          <Copy>
            {selected.contentType ?? "Format unavailable"} ·{" "}
            {selected.bytes ?? "Size unavailable"}
          </Copy>
          <Copy>
            {selected.expiresAt
              ? `Expiry: ${selected.expiresAt}`
              : "Expiry was not supplied."}
          </Copy>
          {preview && <MediaPlayer key={preview.uri} {...preview} />}
          <Button
            label="Preview media file"
            secondary
            busy={busy}
            onPress={() => void download()}
          />
          <Button
            label="Save or share file"
            busy={busy}
            onPress={() => void download(true)}
          />
          <Button
            label="Open temporary download in browser"
            secondary
            busy={busy}
            onPress={() =>
              void run(
                async (signal) =>
                  downloadLink(
                    await api.request(`/v1/files/${selected.id}/download-url`, {
                      method: "POST",
                      signal,
                    }),
                  ),
                (value) => {
                  void WebBrowser.openBrowserAsync(value.url).catch(() =>
                    setMessage("The download browser could not open."),
                  );
                },
              ).catch(() => {})
            }
          />
          <Button
            label="Delete file"
            secondary
            disabled={busy}
            onPress={() =>
              Alert.alert(
                "Delete this file?",
                "This removes the file from OpenJM after server confirmation.",
                [
                  { text: "Keep file", style: "cancel" },
                  {
                    text: "Delete file",
                    style: "destructive",
                    onPress: () =>
                      void run(
                        (signal) =>
                          api.request(`/v1/files/${selected.id}`, {
                            method: "DELETE",
                            signal,
                          }),
                        () => {
                          setItems((current) =>
                            current.filter((item) => item.id !== selected.id),
                          );
                          setSelected(null);
                          setPreview(null);
                          setMessage("File deletion confirmed by OpenJM.");
                        },
                      ).catch(() => {}),
                  },
                ],
              )
            }
          />
        </>
      )}
      <Copy muted>
        Images support up to 8 MiB; document uploads and downloads support up to
        24 MiB. A failed upload is never repeated automatically.
      </Copy>
    </Screen>
  );
}
