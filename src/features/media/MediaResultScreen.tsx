import { useCallback, useState } from "react";
import { Alert, AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../platform/runtime";
import { cacheBinary, shareBinary } from "../../platform/exports";
import { MediaPlayer } from "../../platform/MediaPlayer";
import { Button, Copy, Feedback, Screen, Title } from "../../ui/controls";
import { useFeatureTask } from "../../ui/useFeatureTask";
import { contentPath, generationPath, mediaJob } from "./mediaModel";
import type { MediaJob, MediaKind } from "./mediaModel";
export function MediaResultScreen({
  kind,
  id,
}: {
  kind: MediaKind;
  id: string;
}) {
  const [job, setJob] = useState<MediaJob | null>(null),
    [uri, setUri] = useState<string | null>(null),
    [tracking, setTracking] = useState(false);
  const [previewKind, setPreviewKind] = useState<MediaKind>(kind);
  const { run, busy, error } = useFeatureTask();
  const load = useCallback(
    () =>
      run(
        async (signal) =>
          mediaJob(
            await api.request(
              `${generationPath(kind)}/${encodeURIComponent(id)}`,
              { signal },
            ),
            kind,
            id,
          ),
        setJob,
      ),
    [run, kind, id],
  );
  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void load().catch(() => {});
      });
      return () => {
        listener.remove();
        setUri(null);
      };
    }, [load]),
  );
  const terminal =
    job && ["completed", "failed", "cancelled"].includes(job.status ?? "");
  async function download(share = false, thumbnail = false) {
    if (!job) return;
    await run(
      async (signal) => {
        const payload = await api.binary(
          thumbnail
            ? `${generationPath("video")}/${job.id}/thumbnail`
            : contentPath(kind, job),
          { signal },
        );
        const expected = thumbnail
          ? "image/"
          : kind === "music"
            ? "audio/"
            : `${kind}/`;
        if (!payload.contentType.startsWith(expected))
          throw new Error("The media format could not be used.");
        if (share) {
          await shareBinary(payload);
          return null;
        }
        return cacheBinary(payload).uri;
      },
      (value) => {
        if (value) {
          setPreviewKind(thumbnail ? "image" : kind);
          setUri(value);
        }
      },
    ).catch(() => {});
  }
  return (
    <Screen>
      <Title>
        {kind === "image"
          ? "Generated image"
          : kind === "video"
            ? "Generated video"
            : "Generated music"}
      </Title>
      <Feedback message={error} />
      <Copy>
        {job?.status ??
          (job?.submission
            ? `Submission ${job.submission}; completion is unconfirmed.`
            : "Reading server status…")}
      </Copy>
      {job?.stage && <Copy>{job.stage}</Copy>}
      {job?.progress != null && <Copy>Progress: {job.progress}</Copy>}
      {uri && <MediaPlayer key={uri} uri={uri} kind={previewKind} />}
      <Button
        label="Refresh media status"
        secondary
        busy={busy}
        onPress={() => void load().catch(() => {})}
      />
      {job?.status === "completed" && (
        <>
          <Button
            label={
              kind === "image"
                ? "View image"
                : kind === "video"
                  ? "Load video"
                  : "Load music"
            }
            busy={busy}
            onPress={() => void download()}
          />
          {kind === "video" && (
            <Button
              label="View video thumbnail"
              secondary
              busy={busy}
              onPress={() => void download(false, true)}
            />
          )}
          <Button
            label="Save or share media"
            secondary
            busy={busy}
            onPress={() => void download(true)}
          />
          <Copy muted>
            Downloads are limited to 24 MiB on this device. Playback pauses when
            you leave or background this screen.
          </Copy>
        </>
      )}
      {job && !terminal && (
        <Button
          label={
            tracking
              ? "Completion alert enabled"
              : "Notify me when media finishes"
          }
          secondary
          disabled={busy || tracking}
          onPress={() =>
            void run(
              (signal) =>
                api.request<{ tracking: boolean }>(
                  `/v1/notifications/media/${kind}/${job.id}`,
                  { method: "POST", signal },
                ),
              (value) => {
                if (value.tracking !== true)
                  throw new Error("The alert could not be confirmed.");
                setTracking(true);
              },
            ).catch(() => {})
          }
        />
      )}
      {kind === "video" && job && !terminal && (
        <Button
          label="Cancel video generation"
          secondary
          disabled={busy}
          onPress={() =>
            Alert.alert(
              "Cancel this video?",
              "Cancellation is confirmed by the server.",
              [
                { text: "Keep running", style: "cancel" },
                {
                  text: "Cancel video",
                  style: "destructive",
                  onPress: () =>
                    void run(
                      async (signal) =>
                        mediaJob(
                          await api.request(
                            `${generationPath(kind)}/${job.id}`,
                            { method: "DELETE", signal },
                          ),
                          kind,
                          id,
                        ),
                      setJob,
                    ).catch(() => {}),
                },
              ],
            )
          }
        />
      )}
    </Screen>
  );
}
