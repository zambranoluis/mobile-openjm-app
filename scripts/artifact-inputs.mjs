import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";
const root = process.cwd();
const [mode, recordPath] = process.argv.slice(2);
if (!["create", "verify"].includes(mode) || !recordPath)
  throw new Error("Use artifact-inputs.mjs create|verify <record.json>.");
const target = resolve(recordPath);
if (
  !target.startsWith(resolve("workspace/native-app/records") + "\\") &&
  !target.startsWith(resolve("workspace/native-app/records") + "/")
)
  throw new Error("Input records belong in workspace/native-app/records.");
async function walk(path) {
  return (
    await Promise.all(
      (await readdir(path, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? walk(resolve(path, entry.name))
          : [resolve(path, entry.name)],
      ),
    )
  ).flat();
}
const paths = [
  ...(
    await Promise.all(
      ["app", "src", "scripts", "assets"].map((path) => walk(resolve(path))),
    )
  ).flat(),
  ...[
    "app.config.ts",
    "package.json",
    "package-lock.json",
    "eas.json",
    "tsconfig.json",
  ].map((path) => resolve(path)),
].sort();
const sourceHashes = await Promise.all(
  paths.map(async (path) => ({
    path: relative(root, path).replaceAll("\\", "/"),
    sha256: createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
  })),
);
if (mode === "create") {
  await writeFile(
    target,
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        sourceHashes,
        purpose:
          "Frozen local Android fixture build inputs; fictional environment, debug certificate",
        status: "Build pending; no installation or release claim",
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
} else {
  const recorded = JSON.parse(await readFile(target, "utf8"));
  if (JSON.stringify(recorded.sourceHashes) !== JSON.stringify(sourceHashes))
    throw new Error(
      "Build input drift: added, removed or changed source. Preserve a separate artifact revision.",
    );
}
console.log(`${mode}: ${sourceHashes.length} input hashes ${target}`);
