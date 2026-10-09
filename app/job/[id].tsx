import { useLocalSearchParams } from "expo-router";
import { JobScreen } from "../../src/features/conversations/JobScreen";
export default function Job() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <JobScreen key={id} id={id} />;
}
