import { readFile, writeFile } from "node:fs/promises";
const documents = [
  ["Terms of service", "terms_of_service"],
  ["Privacy policy", "privacy_policy"],
  ["Cookie policy", "cookie_policy"],
  ["Subprocessors", "subprocessors"],
  ["Security policy", "security_policy"],
  ["AI transparency", "ai_transparency"],
  ["Acceptable use policy", "acceptable_use_policy"],
  ["Data processing addendum", "data_processing_addendum"],
  ["Copyright policy", "copyright_policy"],
];
const values = Object.fromEntries(
  await Promise.all(
    documents.map(async ([title, file]) => [
      title,
      await readFile(`assets/legal/${file}.md`, "utf8"),
    ]),
  ),
);
const generated =
  "// Generated from retained approved copy with scripts/legal.mjs. Do not edit.\nexport const legalDocuments:Record<string,string> = " +
  JSON.stringify(values, null, 2) +
  ";\n";
const target = "src/features/account/legalDocuments.ts";
if (process.argv.includes("--write")) await writeFile(target, generated);
if ((await readFile(target, "utf8")) !== generated)
  throw new Error(
    "Legal copy drift: run npm run legal:generate after reviewing the retained source.",
  );
console.log(
  "All nine retained legal documents match the generated native copy.",
);
