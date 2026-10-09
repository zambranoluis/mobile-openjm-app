import { useLocalSearchParams } from "expo-router";
import { HistoryScreen } from "../../src/features/conversations/HistoryScreen";
export default function Group() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HistoryScreen key={id} groupId={id} />;
}
