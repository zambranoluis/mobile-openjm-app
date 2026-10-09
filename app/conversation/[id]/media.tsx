import { useLocalSearchParams } from "expo-router";
import { MediaScreen } from "../../../src/features/media/MediaScreen";
export default function MediaRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MediaScreen key={id} conversationId={id} />;
}
