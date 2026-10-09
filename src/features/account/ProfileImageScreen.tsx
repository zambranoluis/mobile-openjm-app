import { useCallback, useState } from "react";
import { Alert, Image } from "react-native";
import { useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { api } from "../../platform/runtime";
import { Button, Copy, Feedback, Screen, Title } from "../../ui/controls";
import { useFeatureTask } from "../../ui/useFeatureTask";
import { asRecord } from "../apps/appModel";

export function profilePicture(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const raw = asRecord(value);
  if (raw.code === "PROFILE_IMAGE_NOT_FOUND") return null;
  const data = raw.imageBase64;
  if (
    typeof data !== "string" ||
    data.length > 4 * Math.ceil((2 * 1024 * 1024) / 3) ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(data)
  )
    throw new Error("The profile photo could not be used.");
  const mime = data.startsWith("iVBORw0KGgo")
    ? "image/png"
    : data.startsWith("/9j/")
      ? "image/jpeg"
      : null;
  if (!mime) throw new Error("The profile photo format is unsupported.");
  return `data:${mime};base64,${data}`;
}
export function ProfileImageScreen() {
  const [uri, setUri] = useState<string | null>(null),
    [confirmed, setConfirmed] = useState(false);
  const { run, busy, error } = useFeatureTask();
  const load = useCallback(
    () =>
      run(
        (signal) => api.request("/v1/me/image", { signal }),
        (value) => setUri(profilePicture(value)),
      ).catch(() => {}),
    [run],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function upload() {
    await run(
      async (signal) => {
        const selection = await DocumentPicker.getDocumentAsync({
          type: ["image/png", "image/jpeg"],
          multiple: false,
          copyToCacheDirectory: true,
        });
        if (selection.canceled || signal.aborted) return undefined;
        const file = new File(selection.assets[0].uri);
        try {
          if (file.size < 1 || file.size > 2 * 1024 * 1024)
            throw new Error("Choose a PNG or JPEG photo of at most 2 MiB.");
          const imageBase64 = await file.base64();
          if (signal.aborted) return undefined;
          profilePicture({ imageBase64 });
          return profilePicture(
            await api.request("/v1/me/image", {
              method: "PUT",
              signal,
              body: JSON.stringify({ imageBase64 }),
            }),
          );
        } finally {
          if (file.exists) file.delete();
        }
      },
      (result) => {
        if (result !== undefined) {
          setUri(result);
          setConfirmed(true);
        }
      },
    ).catch(() => {});
  }
  async function remove() {
    await run(
      async (signal) => {
        await api.request("/v1/me/image", { method: "DELETE", signal });
      },
      () => {
        setUri(null);
        setConfirmed(true);
      },
    ).catch(() => {});
  }
  return (
    <Screen>
      <Title localize>Profile photo</Title>
      <Copy muted>
        Choose a PNG or JPEG of at most 2 MiB. OpenJM validates and removes
        image metadata.
      </Copy>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", aspectRatio: 1 }}
          resizeMode="contain"
          accessibilityLabel="Your profile photo"
        />
      ) : (
        <Copy>No profile photo is configured.</Copy>
      )}
      <Feedback message={error} />
      {confirmed && <Copy>Profile photo change confirmed by OpenJM.</Copy>}
      <Button
        label="Choose profile photo"
        busy={busy}
        onPress={() => void upload()}
      />
      <Button
        label="Refresh profile photo"
        secondary
        disabled={busy}
        onPress={() => void load()}
      />
      {uri && (
        <Button
          label="Remove profile photo"
          secondary
          disabled={busy}
          onPress={() =>
            Alert.alert(
              "Remove profile photo?",
              "OpenJM must confirm removal.",
              [
                { text: "Keep photo", style: "cancel" },
                {
                  text: "Remove photo",
                  style: "destructive",
                  onPress: () => void remove(),
                },
              ],
            )
          }
        />
      )}
    </Screen>
  );
}
