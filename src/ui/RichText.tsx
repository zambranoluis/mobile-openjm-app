import { useMemo } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { richDocument, externalLink } from "./markdownModel";
import type { RichNode } from "./markdownModel";
import { color, text } from "./theme";
import { Formula } from "../platform/Formula";

function open(value: string) {
  const url = externalLink(value);
  if (url)
    void Linking.openURL(url).catch(() =>
      Alert.alert("Link unavailable", "The link could not be opened."),
    );
}
function inline(nodes: RichNode[]): React.ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === "softbreak" || node.type === "hardbreak") return "\n";
    const href = externalLink(node.attrs.href ?? "");
    const content = node.children.length ? inline(node.children) : node.content;
    if (node.type === "image")
      return (
        <Text
          key={index}
          style={styles.link}
          accessibilityRole={externalLink(node.attrs.src) ? "link" : undefined}
          onPress={
            externalLink(node.attrs.src)
              ? () => open(node.attrs.src)
              : undefined
          }
        >
          {node.content || "View image"}
        </Text>
      );
    return (
      <Text
        key={index}
        selectable
        style={[
          node.type === "strong" && styles.strong,
          node.type === "em" && styles.emphasis,
          node.type === "s" && styles.strike,
          node.type === "code_inline" && styles.code,
          node.type === "link" && !!href && styles.link,
        ]}
        accessibilityRole={node.type === "link" && href ? "link" : undefined}
        onPress={node.type === "link" && href ? () => open(href) : undefined}
      >
        {content}
      </Text>
    );
  });
}
function blocks(nodes: RichNode[]): React.ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "math_source":
        return (
          <Text key={index} selectable style={[styles.body, styles.code]}>
            {node.content}
          </Text>
        );
      case "math":
        return (
          <Formula
            key={index}
            source={node.content}
            displayMode={node.info === "display"}
          />
        );
      case "heading":
      case "paragraph":
        if (
          node.children.some((child) =>
            child.children.some((item) => item.type === "math"),
          )
        ) {
          const children = node.children.flatMap((child) =>
            child.type === "inline" ? child.children : [child],
          );
          const pieces: React.ReactNode[] = [];
          let textNodes: RichNode[] = [];
          const flush = () => {
            if (textNodes.length) {
              pieces.push(
                <Text
                  key={`text-${pieces.length}`}
                  selectable
                  style={styles.body}
                >
                  {inline(textNodes)}
                </Text>,
              );
              textNodes = [];
            }
          };
          for (const child of children) {
            if (child.type === "math") {
              flush();
              pieces.push(
                <Formula
                  key={`math-${pieces.length}`}
                  source={child.content}
                  displayMode={child.info === "display"}
                />,
              );
            } else textNodes.push(child);
          }
          flush();
          return (
            <View key={index} style={styles.container}>
              {pieces}
            </View>
          );
        }
        return (
          <Text
            key={index}
            selectable
            accessibilityRole={node.type === "heading" ? "header" : undefined}
            style={[
              styles.body,
              node.type === "heading" && styles.heading,
              node.tag === "h1" && styles.title,
            ]}
          >
            {inline(
              node.children.flatMap((child) =>
                child.type === "inline" ? child.children : [child],
              ),
            )}
          </Text>
        );
      case "fence":
      case "code_block":
        return (
          <View key={index} style={styles.codeBlock}>
            {node.info ? (
              <Text style={styles.caption}>{node.info.trim()}</Text>
            ) : null}
            <ScrollView horizontal accessibilityLabel="Scrollable code block">
              <Text selectable style={[styles.body, styles.code]}>
                {node.content.replace(/\n$/, "")}
              </Text>
            </ScrollView>
          </View>
        );
      case "bullet_list":
      case "ordered_list":
        return (
          <View key={index} style={styles.container}>
            {node.children.map((item, ordinal) => (
              <View key={ordinal} style={styles.listItem}>
                <Text style={styles.body}>
                  {node.type === "bullet_list"
                    ? "•"
                    : `${Number(node.attrs.start ?? 1) + ordinal}.`}
                </Text>
                <View style={styles.listContent}>{blocks(item.children)}</View>
              </View>
            ))}
          </View>
        );
      case "blockquote":
        return (
          <View key={index} style={styles.quote}>
            {blocks(node.children)}
          </View>
        );
      case "table":
        return (
          <ScrollView
            key={index}
            horizontal
            accessibilityLabel="Scrollable table"
          >
            <View style={styles.table}>{blocks(node.children)}</View>
          </ScrollView>
        );
      case "tr":
        return (
          <View key={index} style={styles.tableRow}>
            {blocks(node.children)}
          </View>
        );
      case "td":
      case "th":
        return (
          <View key={index} style={styles.cell}>
            <Text
              selectable
              style={[styles.body, node.type === "th" && styles.strong]}
            >
              {inline(node.children.flatMap((child) => child.children))}
            </Text>
          </View>
        );
      case "hr":
        return <View key={index} style={styles.rule} />;
      case "text":
        return (
          <Text key={index} selectable style={styles.body}>
            {node.content}
          </Text>
        );
      default:
        return (
          <View key={index} style={styles.container}>
            {node.children.length ? (
              blocks(node.children)
            ) : (
              <Text selectable style={styles.body}>
                {node.content}
              </Text>
            )}
          </View>
        );
    }
  });
}
export function RichText({ children }: { children: string }) {
  const document = useMemo(() => richDocument(children), [children]);
  return <View style={styles.container}>{blocks(document)}</View>;
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  body: { color: color.text, fontSize: text.body, lineHeight: 25 },
  heading: { fontSize: 22, fontWeight: "600", lineHeight: 30 },
  title: { fontSize: 26, lineHeight: 34 },
  strong: { fontWeight: "700" },
  emphasis: { fontStyle: "italic" },
  strike: { textDecorationLine: "line-through" },
  code: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: color.panel,
  },
  codeBlock: {
    padding: 16,
    gap: 8,
    backgroundColor: color.panel,
    borderRadius: 12,
  },
  caption: { color: color.secondary, fontSize: text.metadata },
  link: { color: color.action, textDecorationLine: "underline" },
  listItem: { flexDirection: "row", gap: 10 },
  listContent: { flex: 1, gap: 8 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: color.outline,
    paddingLeft: 16,
    gap: 12,
  },
  table: { borderWidth: 1, borderColor: color.outline },
  tableRow: { flexDirection: "row" },
  cell: {
    width: 200,
    padding: 12,
    borderWidth: 0.5,
    borderColor: color.outline,
  },
  rule: { height: 1, backgroundColor: color.outline, marginVertical: 8 },
});
