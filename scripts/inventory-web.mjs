import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";

if (!process.argv[2]) throw new Error("Provide an explicit web source root for coordinated inventory");
const root = resolve(process.argv[2]);
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
const baseline = JSON.parse(await readFile("tests/criteria/capability-inventory.json", "utf8"));
const acceptance = new Map(baseline.operations.map(row => [`${row.method} ${row.route}`, row.acceptance]));
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
      acceptance: acceptance.get(`${method} ${route}`) ?? `${method} authorized success, controlled failure and ownership/expiry; native state/render; ${method === "GET" ? "reopen/reload" : "duplicate input and interruption"}`,
    });
}
await mkdir("tests/criteria", { recursive: true });
await writeFile("tests/criteria/capability-inventory.json", JSON.stringify({ schema: 1, operations: rows }, null, 2) + "\n");
console.log(`Inventoried ${rows.length} web operations; review changed contracts/mappings before parity regeneration.`);
