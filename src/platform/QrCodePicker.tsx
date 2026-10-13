import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Modal, StyleSheet, View } from "react-native";
import { Camera, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import { giftCardCode } from "../features/account/planModel";
import { Button, Copy, Feedback } from "../ui/controls";
import { color } from "../ui/theme";

export function QrCodePicker({ onUseCode, disabled }: { onUseCode: (code: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(AppState.currentState === "active");
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false), scanning = useRef(false);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => listener.remove();
  }, []);
  function review(raw: string) {
    try {
      const code = giftCardCode(raw);
      scanning.current = false;
      setOpen(false);
      // Filling the field is separate from the existing explicit redemption action.
      Alert.alert("Review gift code", code, [
        { text: "Cancel", style: "cancel" },
        { text: "Use code", onPress: () => { onUseCode(code); setError(null); } },
      ]);
    } catch { setError("This QR code does not contain a 12-character gift code."); }
  }
  async function scan() {
    if (disabled || pending.current) return;
    pending.current = true;
    try {
      const permission = await Camera.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error("Camera access was denied. Enter the code manually or choose a QR image.");
      setError(null); scanning.current = true; setOpen(true);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The camera could not be opened."); }
    finally { pending.current = false; }
  }
  async function image() {
    if (disabled || pending.current) return;
    pending.current = true;
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: false, quality: 1 });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (new File(asset.uri).size > 12 * 1024 * 1024) throw new Error("Choose a QR image smaller than 12 MiB.");
      const results = await Camera.scanFromURLAsync(asset.uri, ["qr"]);
      const codes = [...new Set(results.flatMap((result) => { try { return [giftCardCode(result.data)]; } catch { return []; } }))];
      if (codes.length !== 1) throw new Error("Choose an image containing one valid gift code.");
      review(codes[0]);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The QR image could not be read."); }
    finally { pending.current = false; }
  }
  return <View style={styles.controls}>
    <Button secondary label="Scan gift QR" disabled={disabled} onPress={() => void scan()} />
    <Button secondary label="Choose QR image" disabled={disabled} onPress={() => void image()} />
    <Feedback message={error} />
    <Modal visible={open} onRequestClose={() => { scanning.current = false; setOpen(false); }}>
      <SafeAreaView style={styles.screen}>
        <Copy>Point the camera at the gift code. You will review it before using it.</Copy>
        {active && open && <CameraView style={styles.camera} facing="back" mode="picture" barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={(result) => { if (scanning.current) review(result.data); }} />}
        <Feedback message={error} />
        <Button secondary label="Cancel scanning" onPress={() => { scanning.current = false; setOpen(false); }} />
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({ controls: { gap: 8 }, screen: { flex: 1, backgroundColor: color.canvas, padding: 16, gap: 16 }, camera: { flex: 1 } });
