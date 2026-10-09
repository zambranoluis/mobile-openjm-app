import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
// Use the pinned Expo CLI's own generator so checks work without a running Metro server.
// Reverify this SDK-owned integration when upgrading Expo; output remains an ignored cache.
const require = createRequire(import.meta.url);
const expo = createRequire(require.resolve("@expo/cli/package.json"));
process.env.EXPO_ROUTER_APP_ROOT = resolve("app");
const { requireContext } = expo("expo-router/internal/testing");
const { EXPO_ROUTER_CTX_IGNORE } = expo("expo-router/_ctx-shared");
const { getTypedRoutesDeclarationFile } = expo(
  "@expo/router-server/build/typed-routes/generate",
);
const declaration = getTypedRoutesDeclarationFile(
  requireContext(resolve("app"), true, EXPO_ROUTER_CTX_IGNORE),
  {},
);
if (typeof declaration !== "string" || !declaration.includes("__routes"))
  throw new Error("Expo route generation failed.");
await mkdir(".expo/types", { recursive: true });
await writeFile(".expo/types/router.d.ts", declaration);
