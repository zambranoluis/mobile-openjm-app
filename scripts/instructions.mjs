import { readFile, writeFile, readdir, access, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const sources = [
  "AGENTS.md",
  "AGENTS/WORK.md",
  "AGENTS/CODE.md",
  "AGENTS/NATIVE.md",
  "AGENTS/INSTRUCTIONS.md",
];
const header =
  "<!-- Generated from canonical local guidance. Run npm run instructions:generate; do not edit. -->\n";
const parts = [];
for (const file of sources) {
  const body = await readFile(file, "utf8");
  parts.push(
    `\n<!-- Source: ${file} -->\n` +
      body.replace(/\]\(([^)]+)\)/g, (whole, target) => {
        if (/^(https?:|#)/.test(target)) return whole;
        const absolute = resolve(dirname(file), target);
        const relative = absolute
          .slice(resolve(".").length + 1)
          .replaceAll("\\", "/");
        return `](../${relative})`;
      }),
  );
}
const generated = header + parts.join("\n");
if (process.argv.includes("--write")) {
  await mkdir(".github", { recursive: true });
  await writeFile(".github/copilot-instructions.md", generated);
} else if (
  (await readFile(".github/copilot-instructions.md", "utf8")) !== generated
)
  throw new Error("Copilot adapter drift; regenerate");
if ((await readFile("CLAUDE.md", "utf8")).trim() !== "@AGENTS.md")
  throw new Error("Claude import drift");
async function walk(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)],
      ),
    )
  ).flat();
}
const docs = [
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "PRODUCT.md",
  "DESIGN.md",
  ...(await walk("AGENTS")),
  resolve("tests/README.md"),
  resolve(".github/copilot-instructions.md"),
];
for (const file of docs) {
  for (const match of (await readFile(file, "utf8")).matchAll(
    /\]\(([^)#]+)(?:#[^)]*)?\)/g,
  )) {
    if (/^(https?:|mailto:)/.test(match[1])) continue;
    await access(resolve(dirname(file), match[1]));
  }
}
console.log(
  "Canonical links, Claude import and generated Copilot adapter passed. Host loading is a separate runtime check.",
);
