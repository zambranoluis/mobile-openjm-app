import { useCallback, useRef, useState } from "react";
import { Alert, Pressable, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "../../platform/runtime";
import type { Conversation } from "../../api/types";
import { Button, Copy, Feedback, Screen } from "../../ui/controls";
import { IconButton } from "../../ui/IconButton";
import { color, target } from "../../ui/theme";
import { useLanguage } from "../../platform/language";
import { DateField } from "../../platform/DateField";
import { historyPage, historyQuery, historySections } from "./historyModel";

export function HistoryScreen({ groupId }: { groupId?: string } = {}) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Conversation[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [after, setAfter] = useState<Date | null>(null), [before, setBefore] = useState<Date | null>(null);
  const [applied, setApplied] = useState<{ query: string; after: Date | null; before: Date | null }>({ query: "", after: null, before: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const generation = useRef(0), operation = useRef(false);
  const load = useCallback(async (next?: string) => {
    const request = ++generation.current;
    setBusy(true);
    try {
      if (groupId) {
        const group = await api.request<{ id: unknown; name: unknown }>(`/v1/groups/${encodeURIComponent(groupId)}`);
        if (group.id !== groupId || typeof group.name !== "string") throw new Error("The group could not be used.");
        if (request === generation.current) setGroupName(group.name);
      }
      const page = historyPage(await api.request(historyQuery({ ...applied, groupId, cursor: next })));
      if (next && page.cursor === next) throw new Error("Conversation pagination did not advance.");
      if (request !== generation.current) return;
      setItems((old) => next ? [...new Map([...old, ...page.items].map((item) => [item.id, item])).values()] : page.items);
      setCursor(page.cursor);
      setError(null);
    } catch (failure) {
      if (request === generation.current) setError(failure instanceof Error ? failure.message : "Could not load conversations.");
    } finally { if (request === generation.current) setBusy(false); }
  }, [applied, groupId]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  function apply() {
    try {
      historyQuery({ query: search, after, before });
      setApplied({ query: search.trim(), after, before });
      setFiltersOpen(false);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Choose a valid date range."); }
  }
  function remove(item: Conversation) {
    Alert.alert(t("Delete this conversation?"), item.title || t("Untitled conversation"), [
      { text: t("Keep conversation"), style: "cancel" },
      { text: t("Delete"), style: "destructive", onPress: () => {
        if (operation.current) return;
        operation.current = true;
        void api.request(`/v1/conversations/${encodeURIComponent(item.id)}`, { method: "DELETE" })
          .then(() => load()).catch((failure: unknown) => setError(failure instanceof Error ? failure.message : "Deletion could not be confirmed."))
          .finally(() => { operation.current = false; });
      } },
    ]);
  }
  const newChat = () => router.push("/conversation/new");
  return <Screen scroll={false}>
    <SectionList sections={historySections(items)} keyExtractor={(item) => item.id} stickySectionHeadersEnabled
      keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list} refreshing={busy && items.length > 0}
      onRefresh={() => void load()} initialNumToRender={12} windowSize={7}
      ListHeaderComponent={<View style={styles.controls}>
        {groupName && <Copy>{groupName}</Copy>}
        <View style={styles.search}>
          <TextInput accessibilityLabel={t("Search conversations")} placeholder={t("Search conversations")}
            placeholderTextColor={color.muted} value={search} onChangeText={setSearch} onSubmitEditing={apply}
            returnKeyType="search" style={styles.input} />
          <IconButton label="Search" icon="search-outline" onPress={apply} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t("Filters")}
          accessibilityState={{ expanded: filtersOpen }} onPress={() => setFiltersOpen(!filtersOpen)} style={styles.filter}>
          <Ionicons name="filter-outline" color={color.secondary} size={20} accessible={false} />
          <Text style={styles.filterLabel}>{t("Filters")}{applied.after || applied.before ? " •" : ""}</Text>
        </Pressable>
        {filtersOpen && <View style={styles.filters}>
          <DateField label="Start date" value={after} onChange={setAfter} />
          <DateField label="End date" value={before} onChange={setBefore} />
          {!groupId && <Button secondary label="Conversation groups" onPress={() => router.push("/groups")} />}
          <Button label="Apply filters" onPress={apply} />
          <Button secondary label="Clear filters" onPress={() => { setAfter(null); setBefore(null); setSearch(""); setApplied({query:"",after:null,before:null}); setFiltersOpen(false); }} />
        </View>}
        <Feedback message={error} />
        {error && items.length > 0 && <Copy muted>Showing previously loaded conversations.</Copy>}
      </View>}
      ListEmptyComponent={<View style={styles.empty}>
        {busy ? <Copy muted>Loading conversations…</Copy> : error ? <Button label="Retry" secondary onPress={() => void load()} /> : <>
          <Text accessibilityRole="header" style={styles.emptyTitle}>{t("No conversations yet")}</Text>
          <Copy muted>{applied.query || applied.after || applied.before ? t("No conversations match these filters.") : t("Start a conversation to populate the history list.")}</Copy>
          <Button secondary label="New chat" onPress={newChat} />
        </>}
      </View>}
      renderSectionHeader={({ section }) => <Text accessibilityRole="header" style={styles.date}>{t(section.title)}</Text>}
      renderItem={({ item }) => <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={item.title || t("Untitled conversation")}
          style={({ pressed }) => [styles.rowBody, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: "/conversation/[id]", params: { id: item.id } })}>
          <Text style={styles.rowTitle}>{item.title || t("Untitled conversation")}</Text>
          {!!(item.preview || item.model) && <Text style={styles.preview}>{item.preview || item.model}</Text>}
        </Pressable>
        <IconButton label={`${t("Conversation actions")}: ${item.title || t("Untitled conversation")}`} icon="ellipsis-horizontal" onPress={() => remove(item)} />
      </View>}
      ListFooterComponent={cursor ? <View style={styles.controls}><Button label="Load more" secondary busy={busy} onPress={() => void load(cursor)} /></View> : null} />
    <View pointerEvents="box-none" style={styles.newChatDock}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("New chat")} onPress={newChat}
        style={({ pressed }) => [styles.newChat, pressed && styles.pressed]}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color={color.canvas} accessible={false} />
      </Pressable>
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  list: { flexGrow: 1, paddingBottom: 88, backgroundColor: "#111418" },
  controls: { padding: 12, gap: 12 },
  search: { flexDirection: "row", alignItems: "center", backgroundColor: "#252933", borderRadius: 14 },
  input: { minHeight: target, flex: 1, paddingHorizontal: 12, fontSize: 16, color: color.text, fontFamily: "Roboto" },
  filter: { minHeight: target, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, borderColor: color.outline },
  filterLabel: { color: color.secondary, fontSize: 16, fontFamily: "Roboto-Medium" },
  filters: { gap: 8 },
  empty: { paddingHorizontal: 24, paddingVertical: 24, alignItems: "center", gap: 12 },
  emptyTitle: { color: color.text, fontSize: 18, fontFamily: "Roboto-Medium" },
  date: { backgroundColor: "#1C2022", color: color.secondary, fontFamily: "Roboto-Medium", fontSize: 13, textAlign: "center", padding: 8 },
  row: { backgroundColor: "#222629", flexDirection: "row", alignItems: "flex-start", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.outline, paddingRight: 4 },
  rowBody: { flex: 1, minHeight: 88, padding: 12, gap: 8 },
  rowTitle: { color: color.text, fontSize: 17, fontFamily: "Roboto-Bold" },
  preview: { color: color.secondary, fontSize: 14, lineHeight: 21, fontFamily: "Roboto" },
  pressed: { opacity: 0.75 },
  newChatDock: { position: "absolute", bottom: 16, left: 0, right: 0, alignItems: "center" },
  newChat: { backgroundColor: color.brand, borderRadius: 32, width: 60, height: 60, alignItems: "center", justifyContent: "center" },
});
