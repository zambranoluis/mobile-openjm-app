import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Image, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { Button, Copy, Feedback } from "../ui/controls";
import type { MediaKind } from "../features/media/mediaModel";
function usePauseOnLeave(pause: () => void) {
  const active = useRef(false);
  useFocusEffect(
    useCallback(() => {
      active.current = AppState.currentState === "active";
      const stop = () => {
        try {
          pause();
        } catch {
          /* Disposal can release the native player before effect cleanup. */
        }
      };
      const listener = AppState.addEventListener("change", (state) => {
        active.current = state === "active";
        if (state !== "active") stop();
      });
      return () => {
        active.current = false;
        listener.remove();
        stop();
      };
    }, [pause]),
  );
  return active;
}
function Video({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri),
    status = useEvent(player, "statusChange", {
      status: player.status,
      error: undefined,
    });
  usePauseOnLeave(useCallback(() => player.pause(), [player]));
  return (
    <>
      <VideoView
        style={styles.media}
        player={player}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />
      <Feedback
        message={
          status.status === "error"
            ? "The video could not be played on this device."
            : null
        }
      />
    </>
  );
}
function Audio({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri),
    status = useAudioPlayerStatus(player),
    [error, setError] = useState<string | null>(null);
  const requested = useRef(false);
  const active = usePauseOnLeave(
    useCallback(() => {
      requested.current = false;
      player.pause();
    }, [player]),
  );
  // Android may resume a natively background-paused player before JS resumes.
  // Only an explicit foreground press may restore playback intent.
  useEffect(() => {
    if (status.playing && (!requested.current || !active.current))
      player.pause();
  }, [status.playing, player, active]);
  async function play() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        allowsRecording: false,
      });
      if (!active.current) return;
      if (status.didJustFinish) await player.seekTo(0);
      if (!active.current) return;
      requested.current = true;
      player.play();
    } catch {
      setError("The audio could not be played on this device.");
    }
  }
  return (
    <>
      <Copy>
        {Math.floor(status.currentTime)} / {Math.floor(status.duration)} seconds
      </Copy>
      <Feedback message={error} />
      <Button
        label={status.playing ? "Pause music" : "Play music"}
        disabled={!status.isLoaded}
        onPress={() => {
          if (status.playing) {
            requested.current = false;
            player.pause();
          } else void play();
        }}
      />
      <Button
        label="Restart music"
        secondary
        disabled={!status.isLoaded}
        onPress={() =>
          void player
            .seekTo(0)
            .catch(() => setError("Could not restart playback."))
        }
      />
    </>
  );
}
export function MediaPlayer({ kind, uri }: { kind: MediaKind; uri: string }) {
  const [imageError, setImageError] = useState(false);
  return kind === "image" ? (
    <>
      <Image
        source={{ uri }}
        style={styles.media}
        resizeMode="contain"
        accessibilityLabel="Generated image"
        onError={() => setImageError(true)}
      />
      <Feedback
        message={imageError ? "The image could not be displayed." : null}
      />
    </>
  ) : kind === "video" ? (
    <Video uri={uri} />
  ) : (
    <Audio uri={uri} />
  );
}
const styles = StyleSheet.create({
  media: { width: "100%", aspectRatio: 1, backgroundColor: "#151A19" },
});
