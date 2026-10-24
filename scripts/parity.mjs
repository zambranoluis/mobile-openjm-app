import { readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const criteria = "tests/criteria";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const inventory = JSON.parse(await readFile(`${criteria}/capability-inventory.json`, "utf8"));
const matrix = JSON.parse(await readFile(`${criteria}/parity-matrix.json`, "utf8"));
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
if (inventory.schema !== 1 || matrix.schema !== 1) throw new Error("Unsupported parity criteria schema");
const ids = new Set();
for (const group of ["operations", "surfaces", "requirements"]) {
  if (!Array.isArray(matrix[group]) || matrix[group].length === 0) throw new Error(`Missing ${group} criteria`);
  for (const row of matrix[group]) {
    if (!nonempty(row.id) || ids.has(row.id) || !nonempty(row.destination) || !nonempty(row.source)
      || (group !== "surfaces" && !nonempty(row.acceptance))) throw new Error(`Incomplete or duplicate parity row: ${row.id}`);
    ids.add(row.id);
    if (row.nativeSource) await access(row.nativeSource);
  }
}
if (!Array.isArray(inventory.operations) || inventory.operations.length === 0) throw new Error("Missing operation inventory");
const operationKeys = (rows) => rows.map((row) => {
  if (!nonempty(row.method) || !nonempty(row.route) || !nonempty(row.acceptance)) throw new Error("Incomplete operation criterion");
  return `${row.method} ${row.route}`;
}).sort();
const expected = operationKeys(inventory.operations);
if (new Set(expected).size !== expected.length || JSON.stringify(expected) !== JSON.stringify(operationKeys(matrix.operations)))
  throw new Error("Parity operation inventory drift; review mappings before updating criteria");
if (!Array.isArray(matrix.sourceFreeze) || matrix.sourceFreeze.length === 0) throw new Error("Missing source identities");
const frozen = new Map();
for (const row of matrix.sourceFreeze) {
  if (!nonempty(row.source) || !/^[a-f0-9]{64}$/.test(row.sha256) || frozen.has(row.source)) throw new Error("Invalid source identity");
  frozen.set(row.source, row.sha256);
}
for (const row of [...matrix.operations, ...matrix.surfaces, ...matrix.requirements]) {
  if (!frozen.has(row.source) || (row.sourceSha256 && row.sourceSha256 !== frozen.get(row.source))) throw new Error(`Source identity drift: ${row.id}`);
}
if (process.argv.includes("--write")) {
  const web = process.argv.find((value) => value.startsWith("--web="))?.slice(6);
  if (!web) throw new Error("Coordinated regeneration requires explicit --web=SOURCE; normal checks need no sibling");
  for (const row of matrix.sourceFreeze) row.sha256 = hash(await readFile(resolve(web, row.source)));
  const hashes = new Map(matrix.sourceFreeze.map((row) => [row.source, row.sha256]));
  for (const row of [...matrix.surfaces, ...matrix.requirements]) row.sourceSha256 = hashes.get(row.source);
  await writeFile(`${criteria}/parity-matrix.json`, JSON.stringify(matrix, null, 2) + "\n");
}
console.log(`Parity criteria passed: ${matrix.operations.length} operations, ${matrix.surfaces.length} routes, ${matrix.requirements.length} requirements; no native/live acceptance inferred.`);
