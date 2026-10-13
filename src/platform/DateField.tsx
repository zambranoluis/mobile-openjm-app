import { useState } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button } from "../ui/controls";
import { color } from "../ui/theme";

export function DateField({ label, value, onChange }: { label: string; value: Date | null; onChange: (date: Date | null) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? new Date());
  const picker = <DateTimePicker value={draft} mode="date" themeVariant="dark"
    onChange={(event, date) => {
      if (Platform.OS === "android") setOpen(false);
      if (event.type !== "set" || !date) return;
      if (Platform.OS === "android") onChange(date); else setDraft(date);
    }} />;
  return <View style={styles.field}>
    <Button secondary label={`${label}: ${value ? value.toLocaleDateString() : "Any date"}`}
      onPress={() => { setDraft(value ?? new Date()); setOpen(true); }} />
    {value && <Button secondary label={`Clear ${label.toLowerCase()}`} onPress={() => onChange(null)} />}
    {open && (Platform.OS === "ios" ? <Modal transparent onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}><View style={styles.sheet}>
        {picker}
        <Button label="Use date" onPress={() => { onChange(draft); setOpen(false); }} />
        <Button secondary label="Cancel" onPress={() => setOpen(false)} />
      </View></View>
    </Modal> : picker)}
  </View>;
}
const styles = StyleSheet.create({ field: { gap: 4 }, overlay: { flex: 1, justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: color.panel, padding: 16, borderRadius: 16, gap: 8 } });
