import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url),
  root = dirname(require.resolve("katex/package.json"));
let css = await readFile(join(root, "dist/katex.min.css"), "utf8");
// The supported native WebViews use WOFF2; omit legacy fallback copies from every formula document.
css = css.replace(/,url\(fonts\/[^)]+\) format\("(?:woff|truetype)"\)/g, "");
const urls = [
  ...new Set(
    [...css.matchAll(/url\((fonts\/[^)]+)\)/g)].map((match) => match[1]),
  ),
];
for (const name of urls) {
  const content = await readFile(join(root, "dist", name));
  const mime = name.endsWith("woff2")
    ? "font/woff2"
    : name.endsWith("woff")
      ? "font/woff"
      : "font/ttf";
  css = css.replaceAll(
    `url(${name})`,
    `url(data:${mime};base64,${content.toString("base64")})`,
  );
}
if (/url\((?!data:)/.test(css))
  throw new Error("The math stylesheet still has an external resource.");
const expected =
  JSON.stringify({
    version: JSON.parse(await readFile(join(root, "package.json"), "utf8"))
      .version,
    css,
  }) + "\n";
const destination = "src/platform/math-style.json";
if (process.argv.includes("--write")) {
  await mkdir("assets/licenses", { recursive: true });
  await writeFile(destination, expected);
  await writeFile(
    "assets/licenses/KaTeX.txt",
    await readFile(join(root, "LICENSE")),
  );
} else if ((await readFile(destination, "utf8")) !== expected)
  throw new Error(
    "Math asset drift. Regenerate after a reviewed KaTeX update.",
  );
console.log(
  "Math stylesheet and embedded fonts match the pinned KaTeX package.",
);
