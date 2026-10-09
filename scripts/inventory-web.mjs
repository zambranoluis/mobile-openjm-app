import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";

const root = resolve(process.argv[2] ?? "../web-openjm-frontend");
async function files(dir) {
  return (
    await Promise.all(
      await readdir(dir, { withFileTypes: true }).then((entries) =>
        entries.map((e) =>
          e.isDirectory()
            ? files(resolve(dir, e.name))
            : [resolve(dir, e.name)],
        ),
      ),
    )
  ).flat();
}
const rows = [];
const nativeCoverage = JSON.parse(
  await readFile("workspace/native-app/records/native-coverage.json", "utf8"),
);
for (const file of (await files(resolve(root, "src/app/api")))
  .filter((f) => /route\.(ts|js)$/.test(f))
  .sort()) {
  const source = await readFile(file, "utf8");
  const route =
    "/" +
    relative(resolve(root, "src/app"), file)
      .replaceAll("\\", "/")
      .replace(/\/route\.(ts|js)$/, "")
      .replace(/\[([^\]]+)\]/g, ":$1");
  const methods = [
    ...source.matchAll(
      /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g,
    ),
  ].map((m) => m[1]);
  for (const m of source.matchAll(
    /(?:export\s+const|as)\s+(GET|POST|PUT|PATCH|DELETE)\b/g,
  ))
    methods.push(m[1]);
  const contracts = [
    ...source.matchAll(/backend(V1|Api)Url\(\s*(["'`])(.+?)\2/gs),
  ].map((m) => (m[1] === "V1" ? "/v1" : "/api") + m[3]);
  contracts.push(
    ...[
      ...source.matchAll(
        /(?:audioProxy|proxySharedConversationRequest)\(\s*req,\s*(["'`])(.+?)\1/gs,
      ),
    ].map((m) => "/v1" + m[2]),
  );
  if (source.includes("usesSharedConversationReplay"))
    contracts.push(
      "Legacy Next.js replay broker retained while shared cutover flag is off",
    );
  if (source.includes("const backendPath = renew ?")) {
    for (const match of source.matchAll(
      /(["'])(\/(?:auth\/refresh|users\/session\/touch\?renew=false))\1/g,
    ))
      contracts.push("/api" + match[2]);
  }
  if (source.includes("GET = creditsGet")) {
    const owner = await readFile(
      resolve(root, "src/app/api/credits/route.ts"),
      "utf8",
    );
    if (!owner.includes('backendV1Url("/credits")'))
      throw new Error("Credits alias owner changed; investigate its contract.");
    contracts.push("/v1/credits (credits route alias)");
  }
  if (
    source.includes("GET = unsupported") &&
    source.includes("POST = unsupported") &&
    source.includes("status: 404")
  )
    contracts.push(
      "Deprecated browser route: permanent 404; no backend operation",
    );
  const helperPrefix = source.includes("proxySessionJsonRequest")
    ? "/api"
    : "/v1";
  contracts.push(
    ...[...source.matchAll(/path:\s*(["'`])(.+?)\1/gs)].map(
      (m) => helperPrefix + m[2],
    ),
  );
  const screen = /public/.test(route)
    ? "Anonymous chat / media / files"
    : /voices/.test(route)
      ? "Restricted voice notice"
      : /audio|images|videos/.test(route)
        ? "Media creation / owned result"
        : /jobs/.test(route)
          ? "Response jobs / result"
          : /embeddings/.test(route)
            ? "Embeddings"
            : /files/.test(route)
              ? "Conversation attachments / file library"
              : /groups/.test(route)
                ? "Groups / filtered history"
                : /image-profile/.test(route)
                  ? "Account / Profile photo"
                  : /auth/.test(route)
                    ? "Authentication"
                    : /apps/.test(route)
                      ? "Apps / integration detail"
                      : /conversations|models|groups|files|jobs|images|videos|audio|public/.test(
                            route,
                          )
                        ? "Conversations / result"
                        : "Account / configuration";
  const stage =
    /auth|complete-profile|conversations|models|groups|files|jobs/.test(route)
      ? 3
      : 4;
  const contract =
    [...new Set(contracts)].join("; ") ||
    "Transport helper: inspect linked handler before implementing";
  for (const method of [...new Set(methods)])
    rows.push({
      method,
      route,
      contract,
      source: relative(root, file).replaceAll("\\", "/"),
      screen,
      stage,
      status:
        nativeCoverage[`${method} ${route}`] ??
        (/voices/.test(route)
          ? "Restricted by Spring security"
          : "Not implemented natively; inventoried contract"),
      acceptance: `${method} authorized success, controlled failure and ownership/expiry; native state/render; ${method === "GET" ? "reopen/reload" : "duplicate input and interruption"}`,
    });
}
await mkdir("workspace/native-app/records", { recursive: true });
await writeFile(
  "workspace/native-app/records/capability-inventory.json",
  JSON.stringify(
    {
      inspected: "2026-10-08",
      sourceRoot: "../web-openjm-frontend",
      operations: rows,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  "workspace/native-app/records/capability-matrix.md",
  "# Capability matrix\n\nSource inventory, not live proof. Backend path expressions are evidence from each handler; combined expressions must be resolved against controller/DTO/service before enabling an operation. Deprecated browser authentication routes remain 404; native authentication uses dedicated session endpoints. Legal assets have separate entries below. Matrix acceptance remains pending until an operation has an installed native journey and its backend checks.\n\n| Web operation / evidence | Backend contract evidence | Native screen | Stage | Status | Acceptance |\n| --- | --- | --- | --- | --- | --- |\n" +
    rows
      .map(
        (r) =>
          `| ${r.method} ${r.route} ([source](../../../../web-openjm-frontend/${r.source})) | ${r.contract.replaceAll("|", "\\|").replaceAll("\n", " ")} | ${r.screen} | ${r.stage} | ${r.status} | ${r.acceptance} |`,
      )
      .join("\n") +
    "\n\nLegal documents: terms of service, privacy, cookies, subprocessors, security, AI transparency, acceptable use, data processing and copyright → Account / Legal, stage 4; preserve approved source text; acceptance: offline reading, native scrolling, large text, links and language coverage.\n",
);
console.log(`Inventoried ${rows.length} web operations.`);
