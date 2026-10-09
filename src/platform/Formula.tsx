import { useMemo, useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { WebView } from "react-native-webview";
import { formulaHtml } from "../ui/mathModel";
import style from "./math-style.json";
import { Button, Copy } from "../ui/controls";
export function Formula({
  source,
  displayMode = true,
}: {
  source: string;
  displayMode?: boolean;
}) {
  const { fontScale, width: windowWidth } = useWindowDimensions(),
    [width, setWidth] = useState(windowWidth - 48),
    [height, setHeight] = useState(64),
    [showSource, setShowSource] = useState(false),
    [failed, setFailed] = useState(false);
  const html = useMemo(() => {
    let content: string;
    try {
      content = formulaHtml(source, displayMode);
    } catch {
      return null;
    }
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; script-src 'nonce-openjm-math'"> <style>${style.css}body{margin:0;background:#080B0A;color:#F2F4F3;font-size:${17 * fontScale}px;overflow-x:auto} .katex-display{margin:8px 0}.katex-display>.katex{text-align:left}</style></head><body>${content}<script nonce="openjm-math">function measure(){window.ReactNativeWebView.postMessage(JSON.stringify({height:document.documentElement.scrollHeight,width:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)}));}document.fonts.ready.then(measure);new ResizeObserver(measure).observe(document.body);</script></body></html>`;
  }, [source, displayMode, fontScale]);
  if (!html || failed) return <Copy>{source}</Copy>;
  return (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal accessibilityLabel="Scrollable formula">
        <WebView
          source={{ html, baseUrl: "about:blank" }}
          // The library opens non-whitelisted URLs through the OS. Handle every URL here and reject it.
          originWhitelist={["*"]}
          style={{ height, width, backgroundColor: "#080B0A" }}
          javaScriptEnabled
          domStorageEnabled={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(request) =>
            request.url === "about:blank"
          }
          onError={() => setFailed(true)}
          onMessage={(event) => {
            try {
              const value = JSON.parse(event.nativeEvent.data);
              if (
                typeof value.height === "number" &&
                Number.isFinite(value.height) &&
                value.height >= 1 &&
                value.height <= 4096 &&
                typeof value.width === "number" &&
                Number.isFinite(value.width) &&
                value.width >= 1 &&
                value.width <= 16384
              ) {
                setHeight(Math.ceil(value.height));
                setWidth(Math.ceil(value.width));
              } else setFailed(true);
            } catch {
              setFailed(true);
            }
          }}
        />
      </ScrollView>
      <Button
        label={showSource ? "Hide formula source" : "Read formula source"}
        secondary
        onPress={() => setShowSource((value) => !value)}
      />
      {showSource && <Copy>{source}</Copy>}
    </View>
  );
}
