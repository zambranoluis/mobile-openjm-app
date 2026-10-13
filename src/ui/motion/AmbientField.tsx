import { Dimensions, StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, Fill, Shader, Skia } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { useDecorativeClock } from "./useDecorativeClock";
import { GraphicsFallback } from "./GraphicsFallback";

// Palette/gutters follow the approved web authBackdrop. Native density is bounded.
const source = Skia.RuntimeEffect.Make(`
uniform float2 size;
uniform float time;
float hash(float2 p) { return fract(sin(dot(p,float2(127.1,311.7)))*43758.5453); }
half4 main(float2 p) {
  float2 uv=p/size;
  float gutter=pow(abs(uv.x-0.5)*2.0,3.0);
  float3 light=float3(0.0);
  for(int i=0;i<5;i++) {
    float f=float(i);
    float bend=sin(uv.y*4.1+time*0.11+f)*0.11;
    float x=mod(f,2.0)<1.0 ? 0.08+f*0.025 : 0.92-f*0.02;
    float beam=exp(-abs(uv.x-x-bend)*85.0)*gutter;
    float halo=exp(-abs(uv.x-x-bend)*14.0)*gutter;
    float3 hue=i==2 ? float3(1.0,0.61,0.29) : float3(0.1,0.82,0.64+0.07*f);
    light+=hue*(beam*0.22+halo*0.065);
  }
  float2 cell=floor(p/26.0);
  float seed=hash(cell);
  float2 center=(cell+float2(hash(cell+1.0),hash(cell+2.0)))*26.0;
  float star=seed>0.95 ? exp(-length(p-center)*1.2)*(0.6+0.4*sin(time*0.4+seed*40.0)) : 0.0;
  light+=float3(0.65,1.0,0.83)*star*gutter*0.3;
  float grain=(hash(floor(p))-0.5)*0.009;
  return half4(float3(0.0,0.016,0.024)+light+grain,1.0);
}`);
function Field() {
  const { width } = useWindowDimensions();
  // Screen height stays independent of the Android IME viewport resize.
  const height = Dimensions.get("screen").height;
  const time = useDecorativeClock();
  const uniforms = useDerivedValue(() => ({ size: [width, height], time: time.value }));
  if (!source) return <View style={styles.static} />;
  return <Canvas style={{ width, height }}><Fill><Shader source={source} uniforms={uniforms} /></Fill></Canvas>;
}
export function AmbientField() {
  return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
    <GraphicsFallback fallback={<View style={styles.static} />}><Field /></GraphicsFallback>
  </View>;
}
const styles = StyleSheet.create({ static: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "#000406" } });
