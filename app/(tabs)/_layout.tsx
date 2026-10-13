import { Stack } from "expo-router";
import { WorkspaceHeader } from "../../src/ui/WorkspaceHeader";
import { color } from "../../src/ui/theme";

// Preserve route-group identity for existing protected links; its navigator is now a stack.
export default function WorkspaceLayout() {
  return <Stack initialRouteName="index" screenOptions={{
    header: () => <WorkspaceHeader />,
    contentStyle: { backgroundColor: color.canvas },
  }} />;
}
