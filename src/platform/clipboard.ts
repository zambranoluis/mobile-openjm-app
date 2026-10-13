import { setStringAsync } from "expo-clipboard";

export async function copyText(value: string) {
  try { await setStringAsync(value); }
  catch { throw new Error("The text could not be copied. Select it and try again."); }
}
