import { useLocalSearchParams } from "expo-router";
import { MediaResultScreen } from "../../../src/features/media/MediaResultScreen";
import { mediaKind } from "../../../src/features/media/mediaModel";
import { resourceId } from "../../../src/features/apps/appModel";
import { Copy, Screen } from "../../../src/ui/controls";
export default function MediaResultRoute() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  let target: { kind: ReturnType<typeof mediaKind>; id: string } | null = null;
  try {
    target = { kind: mediaKind(kind), id: resourceId(id) };
  } catch {
    /* Reject malformed links before rendering. */
  }
  return target ? (
    <MediaResultScreen
      key={`${kind}:${id}`}
      kind={target.kind}
      id={target.id}
    />
  ) : (
    <Screen>
      <Copy>This media link could not be used.</Copy>
    </Screen>
  );
}
