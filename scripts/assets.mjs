import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const files = [
  "assets/hummingbird.svg",
  "assets/hummingbird.png",
  "assets/icon.png",
  ...(await readdir("assets/legal"))
    .sort()
    .map((file) => "assets/legal/" + file),
];
const entries = [];
for (const file of files) {
  const bytes = await readFile(file);
  const source = file.endsWith(".svg")
    ? "../web-openjm-frontend/public/images/logos/SVG/hummingbird.svg"
    : file.endsWith(".md")
      ? "../web-openjm-frontend/public/legal/" + file.split("/").at(-1)
      : null;
  if (
    process.argv.includes("--source") &&
    source &&
    hash(await readFile(source)) !== hash(bytes)
  )
    throw new Error("Approved source differs: " + file);
  entries.push({
    file,
    bytes: bytes.length,
    sha256: hash(bytes),
    source,
    derivation: file.endsWith(".png")
      ? "Rasterized from retained hummingbird.svg with Sharp; icon 1024 dark canvas; mark 256 transparent"
      : null,
  });
}
const path = "workspace/native-app/records/assets.json";
const generated =
  JSON.stringify(
    {
      identity: "Approved OpenJM hummingbird and unmodified legal text",
      files: entries,
    },
    null,
    2,
  ) + "\n";
if (process.argv.includes("--write")) await writeFile(path, generated);
if ((await readFile(path, "utf8")) !== generated)
  throw new Error("Retained asset manifest drift; review before updating.");
console.log(
  "Retained brand/legal checksums passed" +
    (process.argv.includes("--source")
      ? " against current approved web sources."
      : "."),
);
