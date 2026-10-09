import * as WebBrowser from "expo-web-browser";
import { checkoutUrl } from "../features/account/billingModel";

export async function openCheckout(payload: unknown) {
  // The browser result is never interpreted as payment success.
  await WebBrowser.openBrowserAsync(checkoutUrl(payload));
}
