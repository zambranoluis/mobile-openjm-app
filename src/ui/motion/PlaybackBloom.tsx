import { StyleSheet } from "react-native";
import { Canvas, Circle, Group } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { useDecorativeClock } from "./useDecorativeClock";
import { GraphicsFallback } from "./GraphicsFallback";

function Bloom({ playing }: { playing: boolean }) {
  const clock = useDecorativeClock(playing);
  const rotation = useDerivedValue(() => [{ rotate: clock.value * 0.18 }]);
  return <Canvas style={styles.canvas} accessible={false}>
    <Group origin={{ x: 64, y: 64 }} transform={rotation}>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = index * Math.PI / 6;
        return <Circle key={index} cx={64 + Math.cos(angle) * 20} cy={64 + Math.sin(angle) * 20}
          r={21} color={index % 2 ? "#52B583" : "#19D18C"} opacity={0.14} />;
      })}
      <Circle cx={64} cy={64} r={12} color="#52B583" opacity={0.8} />
    </Group>
  </Canvas>;
}
export function PlaybackBloom({ playing }: { playing: boolean }) {
  return <GraphicsFallback><Bloom playing={playing} /></GraphicsFallback>;
}
const styles = StyleSheet.create({ canvas: { width: 128, height: 128, alignSelf: "center" } });
