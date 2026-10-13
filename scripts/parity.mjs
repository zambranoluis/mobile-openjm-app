import { readFile, writeFile, readdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";

const records = "workspace/native-app-reproduction/records";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const inventory = JSON.parse(await readFile(`${records}/capability-inventory.json`, "utf8"));
const rules = [
  [/auth/, 3, "auth/LoginScreen", "/login"],
  [/complete-profile/, 3, "auth/CompleteProfileScreen", "/complete-profile"],
  [/image-profile/, 7, "account/ProfileImageScreen", "/account/photo"],
  [/memory-preferences/, 8, "account/PreferencesScreen", "/account/preferences"],
  [/users\/me|security\/sensitive|account\/export/, 7, "account/ProfileScreen", "/account/profile"],
  [/account|billing|credits/, 7, "account/BillingScreen", "/account/billing"],
  [/usage/, 7, "account/UsageScreen", "/account/usage"],
  [/domains/, 8, "account/DomainsScreen", "/account/domains"],
  [/keys/, 8, "account/KeysScreen", "/account/keys"],
  [/memory/, 8, "account/MemoryScreen", "/account/memory"],
  [/apps\/installations/, 8, "apps/InstallationScreen", "/installation/[id]"],
  [/apps/, 8, "apps/AppsScreen", "/(tabs)/apps"],
  [/public-chat/, 6, "anonymous/AnonymousScreen", "/anonymous"],
  [/public-/, 6, "anonymous/AnonymousResourcesScreen", "/anonymous-resources"],
  [/audio|images|videos/, 6, "media/MediaScreen", "/conversation/[id]/media"],
  [/files/, 6, "files/FilesScreen", "/conversation/[id]/files"],
  [/jobs/, 5, "conversations/JobScreen", "/job/[id]"],
  [/embeddings/, 5, "conversations/UtilityScreen", "/embeddings"],
  [/groups/, 5, "conversations/GroupsScreen", "/groups"],
  [/conversations|models/, 5, "conversations/ConversationScreen", "/conversation/[id]"],
];
function mapping(route) {
  const rule = rules.find(([pattern]) => pattern.test(route));
  if (!rule) throw new Error(`Unmapped operation: ${route}`);
  const [, stage, source, destination] = rule;
  return { stage, nativeSource: `src/features/${source}.tsx`, destination };
}
function lanes() {
  return {
    implementation: "in progress", visual: "not started", android: "not started",
    ios: "blocked", live: "blocked", physical: "blocked",
    prerequisite: "iOS/physical runtime, approved staging/QA and signing access unavailable; emulator-only access confirmed",
  };
}

// Explicit requirements complement the operation inventory: a handler cannot prove these flows.
const workflows = [
  ["shell", 2, "dashboard/components/DashboardResponsiveShell.tsx", "/(tabs)", "Branded header/drawer, history default, profile/configuration hierarchy; secondary groups/jobs/embeddings/alerts; native Back/gestures, focus, safe areas, restoration"],
  ["references", 2, "dashboard/components/Navbar.tsx", "src/ui", "Fictional equivalent states at 320/390/430; freeze source/assets/captures, inspect OS adaptations"],
  ["controls", 2, "auth/components/FormFields.tsx", "src/ui/controls.tsx", "Roboto/logos/artwork, compact fields, contextual menus/sheets/dialogs, dates, feedback/loading, 48dp/44pt targets and large text"],
  ["virtualization", 2, "history/components/History.tsx", "/(tabs)", "Virtualized accumulating history/activity; retained pagination and bounded layout"],
  ["auth-entry", 3, "auth/pages/LoginPage.tsx", "/login", "Login/register/recovery/reset/account-created/status/profile completion, guest/legal/language entry"],
  ["auth-challenges", 3, "auth/pages/LoginPage.tsx", "/login", "MFA/TOTP invalid/expired challenges, cooldown/password controls/input retention and authoritative completion"],
  ["auth-lifecycle", 3, "auth/pages/LoginPage.tsx", "src/api/session.ts", "Memory access/SecureStore refresh, installation binding, serialized rotation/expiry/revocation/logout, failed credential removal and restart"],
  ["auth-keyboard", 3, "auth/components/AuthShell.tsx", "src/ui/KeyboardScroll.tsx", "Positive/failure forms with focused input visible at normal/large text"],
  ["bird", 4, "dashboard/components/DashboardLoadingOverlay.tsx", "src/ui/motion", "Offline approved-model transparent frame pipeline, native flight/hover/landing, deterministic provenance/checkpoints"],
  ["launch", 4, "dashboard/hooks/useDashboardLoaderSequence.ts", "app/_layout.tsx", "Immediate static brand, pending-only bird, finish entrance then exit on readiness, no fixed hold/navigation replay; readiness interruption/re-entry"],
  ["login-field", 4, "auth/components/AuthShell.tsx", "/login", "Native beams/stars/grain around quiet form, independent scroll/keyboard region"],
  ["orb", 4, "chat/private/components/ChatMobileHeader.tsx", "/conversation/[id]", "Bounded native standby/working/menu/creation/playback orb driven by actual state"],
  ["bloom", 4, "chat/private/components/ChatMobileHeader.tsx", "src/platform/MediaPlayer.tsx", "Playback bloom without microphone or invented spectrum/progress; contextual skeletons/attachment readiness/transitions"],
  ["motion-lifecycle", 4, "dashboard/hooks/useDashboardLoaderSequence.ts", "src/ui/motion", "Hidden/background/unmount stop/release; reduced motion and renderer/asset failure static fallback; stills/continuous review and 30fps effects-on/off profiles"],
  ["history", 5, "history/components/History.tsx", "/(tabs)", "Compact search/date filters/date rows/row menus/New chat/groups/pagination; loading/empty/error"],
  ["composer", 5, "chat/private/components/ChatMobileHeader.tsx", "/conversation/[id]", "Expanding keyboard-docked composer independent of message list; secondary settings contextual"],
  ["first-send", 5, "chat/private/services/conversations.ts", "/conversation/new", "One action creates+sends including first attachments; persist conversation/submission identity; reconcile uncertain outcomes without retry"],
  ["response-details", 5, "chat/private/services/conversations.ts", "/conversation/[id]", "Actual producer structured thinking/answer, references/context/attachments/results/work state; Thinking/Quotes/Sources, Markdown/code/math/copy/model/mode/reasoning/web search"],
  ["reading-position", 5, "chat/private/services/conversations.ts", "/conversation/[id]", "Conditional auto-follow, stable older-message reading position, older pagination/drafts/stream recovery without duplicate execution"],
  ["jobs", 5, "chat/private/services/conversations.ts", "/job/[id]", "Create/follow/cancel/cold reopen; separate integer job cursor and replay cursor; ownership/interruption"],
  ["embeddings", 5, "chat/private/services/conversations.ts", "/embeddings", "JSON/base64/dimensions, complete result and export with applied options"],
  ["guest", 6, "chat/private/services/conversations.ts", "/anonymous", "Public welcome/multi-turn/composer menus/attachments/details/New chat cleanup"],
  ["media", 6, "chat/private/services/conversations.ts", "/conversation/[id]/media", "Private/public image/music options/results in chat, conditional owned video playback; video generation and voice remain restricted"],
  ["files", 6, "chat/private/services/conversations.ts", "/conversation/[id]/files", "Picker/camera capture/upload readiness/preview/context/download/share; explicit permission, cancellation and recipient receipt"],
  ["anonymous-credentials", 6, "chat/private/services/conversations.ts", "/anonymous-resources", "Resource credentials independent of bearer, expiry/cleanup/cold reopen"],
  ["binary", 6, "chat/private/services/conversations.ts", "src/api/client.ts", "Interrupted downloads discard partial bytes, user retry, retained large-write failure investigation and production transfer compatibility; preserve denied restart"],
  ["profile", 7, "profile/types/profilePanel.ts", "/account/profile", "Personal/security/photo/OTP/two-factor/consequential confirmations; positive/failure/cancel"],
  ["credits-billing", 7, "profile/types/profilePanel.ts", "/account/billing", "Separate credits activity/redemption/top-up and billing plan compare/purchase/subscription; system-browser hosted checkout authoritative return"],
  ["qr", 7, "profile/hooks/useGiftCardQrScanner.ts", "/account/billing", "Native preview QR/image decoding, review then intentional redemption; camera denied/cancel; no automatic redemption"],
  ["usage", 7, "profile/services/usage.ts", "/account/usage", "Summaries/model/metric charts/date-range history/Requests/Conversations/events/plan limits/filters/pagination; authoritative units/costs/balances and missing/partial/stale"],
  ["reports", 7, "profile/services/usageDetails.ts", "/account/usage", "Usage JSON reports and CSV exports distinct from sensitive account export; scope/content equals represented data"],
  ["apps", 8, "apps/services/apps.ts", "/(tabs)/apps", "Catalog/installations/search/status/artwork/details/configuration/install enable/secrets rotate/remove/Obsidian status/import/export; truthful partial outcomes"],
  ["configuration", 8, "configuration/services/memory.ts", "/configuration", "Memories/preferences/tools/domains/API-key hierarchy, sensitive auth/import/export/connection-versus-verification"],
  ["legal", 8, "legal/legalDocuments.ts", "/legal", "Nine approved offline documents, readable navigation/links/large text, supplied legal language"],
  ["languages", 8, "profile/types/profilePanel.ts", "/language", "English/Spanish/Portuguese/Hindi/Chinese/Russian whole-interface review including errors/dynamic labels/large text; user/server text preserved"],
  ["gateway", 9, "chat/private/services/conversations.ts", "src/api/openapi-v1.json", "Trace existing contracts before mappings/DTO changes; gateway spec+snapshot; validated bounded transport/errors/redacted logs; independent build"],
  ["web-build", 9, "dashboard/components/DashboardResponsiveShell.tsx", "../web-openjm-frontend", "Recheck/fix mixed UI/ui production blocker and affected lint/types/quality/build/unit/Playwright through wrappers"],
  ["live", 9, "chat/private/services/conversations.ts", "../web-openjm-backend-api", "QA auth/MFA/profile/attachments/jobs/billing/integrations/ownership, one shared response, duplicate/conflict/disconnect/expiry/backend Redis interruption"],
  ["cutover", 9, "chat/private/services/conversations.ts", "../web-openjm-backend-api", "Preserve legacy readers/records, actual producer drain/retention before separately authorized cutover; dispatch off"],
  ["push", 9, "chat/private/services/conversations.ts", "/account/alerts", "Opt-in account/resource-bound tracking/dedupe/leases/tickets/receipts/invalid/logout cleanup and actual provider/device authenticated links"],
  ["devices", 10, "dashboard/components/Navbar.tsx", "tests/maestro", "Full installed Android+iOS matrix small phones/large text/languages/readers/reduced motion/keyboard/safe areas/gestures/denied permissions"],
  ["network-lifecycle", 10, "chat/private/services/conversations.ts", "tests/maestro", "Network/background/cold restart/refresh races/logout/uploads/downloads/job recovery; complete corrected split journeys"],
  ["physical", 10, "profile/hooks/useGiftCardQrScanner.ts", "tests/maestro", "Physical camera/QR/share receipt/media/audio/push/deep links/animation performance; Android never closes iOS"],
  ["private-builds", 11, "dashboard/components/Navbar.tsx", "eas.json", "Approved HTTPS/QA/EAS/Android signing/Apple provisioning; signed ARM APK and private iOS install smoke/lifecycle on registered testers"],
  ["release-record", 11, "dashboard/components/Navbar.tsx", "output", "Hashes/source/contracts/reproducible builds/install guide/known limits/rollout rollback/additive migrations/active readers; separate hosting/publication direction"],
  ["providers", 1, "dashboard/components/Navbar.tsx", "AGENTS.md", "Independent Codex/Copilot/Claude/OpenCode guidance with format and runtime loading separate; authenticated provider access required"],
];

async function walk(directory) {
  return (await Promise.all((await readdir(directory, { withFileTypes: true })).map((entry) =>
    entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]))).flat();
}
const routeMappings = {
  "/": [6, "/anonymous"], "/login": [3, "/login"], "/register": [3, "/register"],
  "/forgot-password": [3, "/recover"], "/reset-password": [3, "/reset-password"],
  "/account-created": [3, "/register (authoritative status; separate visual state pending)"],
  "/complete-profile": [3, "/complete-profile"], "/top-up-result": [7, "src/platform/checkout.ts (authoritative refresh)"],
  "/dashboard": [2, "/(tabs)"], "/dashboard/apps": [8, "/(tabs)/apps"],
  "/dashboard/configuration": [8, "/configuration (hierarchy pending)"],
};

if (process.argv.includes("--write")) {
  const root = resolve(process.argv.find((value) => value.startsWith("--web="))?.slice(6) ?? "../web-openjm-frontend");
  const operations = inventory.operations.map((operation) => {
    const disposition = /nextauth/.test(operation.route) ? "deprecated browser 404; retain, no native NextAuth clone"
      : /auth\/session\/touch/.test(operation.route) ? "browser session touch; native serialized session refresh replaces browser transport"
      : /voices/.test(operation.route) ? "restricted by server security; no enabled native voice operation"
      : operation.route === "/api/videos" && operation.method === "POST" ? "video generation disabled; owned video reads remain conditional"
      : "native mapping; operation acceptance pending";
    return { id: `OP-${hash(`${operation.method} ${operation.route}`).slice(0, 12)}`, ...operation,
      ...mapping(operation.route), disposition, ...lanes(),
      evidence: "Imported operation-specific baseline text in status; new build acceptance required",
      nextAction: `${operation.acceptance}; inspect installed visual states then verify authoritative QA contract`,
    };
  });
  const surfaces = [];
  for (const file of (await walk(resolve(root, "src/app"))).filter((file) => /[\\/]page\.tsx$/.test(file)).sort()) {
    const source = relative(root, file).replaceAll("\\", "/");
    const route = "/" + relative(resolve(root, "src/app"), file).replaceAll("\\", "/")
      .replace(/(?:^|\/)\([^/]+\)/g, "").replace(/\/page\.tsx$|^page\.tsx$/, "").replace(/^\//, "");
    const routeMapping = routeMappings[route];
    if (!routeMapping) throw new Error(`Unmapped page: ${route}`);
    const [stage, destination] = routeMapping;
    surfaces.push({ id: `SURFACE-${hash(route).slice(0, 12)}`, route, source, sourceSha256: hash(await readFile(file)),
      stage, destination, ...lanes(), evidence: "Current page source; reference captures tracked separately",
      nextAction: "Capture fictional mobile states under web capture policy, implement and inspect equivalent installed native states" });
  }
  const requirements = await Promise.all(workflows.map(async ([id, stage, source, destination, acceptance]) => {
    const sourceFile = `src/features/${source}`;
    await access(resolve(root, sourceFile));
    return { id: `REQ-${id}`, stage, source: sourceFile, sourceSha256: hash(await readFile(resolve(root, sourceFile))),
      destination, acceptance, ...lanes(), evidence: "Traced source requirement; implementation is not acceptance",
      nextAction: acceptance };
  }));
  const sourceFreeze = await Promise.all([...new Set([...operations.map((row) => row.source), ...surfaces.map((row) => row.source),
    ...requirements.map((row) => row.source)])].sort().map(async (source) => ({ source, sha256: hash(await readFile(resolve(root, source))) })));
  const matrix = { schema: 1, sourceRoot: "../web-openjm-frontend", inspected: "2026-10-08", operations, surfaces, requirements, sourceFreeze,
    limits: "Statuses do not infer passing native/live lanes from inventory or retained source. All six languages, all nine legal documents and contextual profile/configuration surfaces are explicit requirement rows." };
  await writeFile(`${records}/parity-matrix.json`, JSON.stringify(matrix, null, 2) + "\n");
  const table = (rows, key) => rows.map((row) => `| ${row.id} | ${key(row).replaceAll("|", "\\|")} | ${row.destination} | ${row.stage} | ${row.implementation} / ${row.visual} / ${row.android} / ${row.ios} / ${row.live} / ${row.physical} | ${row.nextAction.replaceAll("|", "\\|")} |`).join("\n");
  const heading = "| ID | Source / requirement | Native destination | Stage | Implementation / visual / Android / iOS / live / physical | Next action |\n| --- | --- | --- | --- | --- | --- |\n";
  await writeFile(`${records}/parity-matrix.md`, "# Native parity matrix\n\nGenerated by `npm run parity:generate` after web inventory. Detailed source hashes, retained baseline status and dispositions are in parity-matrix.json. Local `npm run parity:check` requires no sibling. Counts: " + `${operations.length} operations, ${surfaces.length} page routes, ${requirements.length} workflow/state/visual/motion requirements.\n\nNo row establishes live or installed acceptance. iOS/live/physical lanes are blocked by prerequisites; Android/visual require per-build evidence. Browser-only/deprecated/restricted operations have explicit dispositions below.\n\n## Routes\n\n` + heading + table(surfaces, (row) => `${row.route} (${row.source})`) + "\n\n## Workflows, screen states, visuals and motion\n\n" + heading + table(requirements, (row) => `${row.acceptance} (${row.source})`) + "\n\n## Operations\n\n" + heading + table(operations, (row) => `${row.method} ${row.route}; ${row.disposition}; ${row.nativeSource}`) + "\n");
}
const matrix = JSON.parse(await readFile(`${records}/parity-matrix.json`, "utf8"));
const ids = new Set();
const states = new Set(["not started", "in progress", "verified", "blocked", "deferred"]);
for (const row of [...matrix.operations, ...matrix.surfaces, ...matrix.requirements]) {
  if (ids.has(row.id) || !row.destination || !row.source || !row.evidence || !row.nextAction || row.stage < 1 || row.stage > 11)
    throw new Error(`Incomplete or duplicate parity row: ${row.id}`);
  ids.add(row.id);
  for (const lane of ["implementation", "visual", "android", "ios", "live", "physical"])
    if (!states.has(row[lane])) throw new Error(`Invalid ${lane} state: ${row.id}`);
  if (row.nativeSource) await access(row.nativeSource);
}
const expected = inventory.operations.map((row) => `${row.method} ${row.route}`).sort();
const actual = matrix.operations.map((row) => `${row.method} ${row.route}`).sort();
if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error("Parity operation inventory drift");
console.log(`Parity records passed: ${matrix.operations.length} operations, ${matrix.surfaces.length} routes, ${matrix.requirements.length} requirements; no native/live acceptance inferred.`);
