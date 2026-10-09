import { useLocalSearchParams } from "expo-router";
import { FilesScreen } from "../../../src/features/files/FilesScreen";
export default function FilesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FilesScreen key={id} conversationId={id} />;
}
