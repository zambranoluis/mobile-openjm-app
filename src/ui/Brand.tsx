import { Image, StyleSheet, View } from "react-native";

export function Brand({ mark = false }: { mark?: boolean }) {
  return <View accessible accessibilityLabel={mark ? "OpenJM hummingbird" : "OpenJM"}>
    <Image accessible={false} source={mark ? require("../../assets/hummingbird.png") : require("../../assets/brand/wordmark.png")}
      resizeMode="contain" style={mark ? styles.mark : styles.word} />
  </View>;
}
const styles = StyleSheet.create({ mark: { width: 40, height: 40 }, word: { width: 96, height: 28 } });
