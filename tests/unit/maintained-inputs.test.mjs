import { test } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "../..");
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "native-maintained-inputs-"));
  for (const file of ["scripts/parity.mjs", "scripts/assets.mjs", "tests/criteria", "assets"])
    await cp(join(repository, file), join(root, file), { recursive: true });
  const matrix = JSON.parse(await readFile(join(root, "tests/criteria/parity-matrix.json"), "utf8"));
  for (const row of matrix.operations) {
    if (!row.nativeSource) continue;
    const destination = join(root, row.nativeSource);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(repository, row.nativeSource), destination);
  }
  return root;
}
const run = (root, script, ...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });

test("normal parity and exact asset gates work with no task records or sibling sources", async () => {
  const root = await fixture();
  await assert.rejects(access(join(root, "workspace")));
  for (const script of ["scripts/parity.mjs", "scripts/assets.mjs"]) {
    const result = run(root, script);
    assert.equal(result.status, 0, result.stderr);
  }
  const criteria = await readFile(join(root, "tests/criteria/parity-matrix.json"), "utf8");
  const result = run(root, "scripts/parity.mjs", "--write");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /explicit --web/);
  assert.equal(await readFile(join(root, "tests/criteria/parity-matrix.json"), "utf8"), criteria);
});

test("missing criteria and changed assets fail without consulting history", async () => {
  const root = await fixture();
  const file = join(root, "tests/criteria/parity-matrix.json");
  const matrix = JSON.parse(await readFile(file, "utf8"));
  matrix.requirements = [];
  await writeFile(file, JSON.stringify(matrix));
  assert.match(run(root, "scripts/parity.mjs").stderr, /Missing requirements/);
  await writeFile(join(root, "assets/hummingbird.png"), "changed asset");
  assert.match(run(root, "scripts/assets.mjs").stderr, /manifest drift/);
});

test("standing parity rows contain requirements and identities without execution state", async () => {
  for (const name of ["capability-inventory.json", "parity-matrix.json"]) {
    const criteria = JSON.parse(await readFile(join(repository, "tests/criteria", name), "utf8"));
    for (const group of ["operations", "surfaces", "requirements"]) {
      for (const row of criteria[group] ?? []) {
        for (const field of ["stage", "status", "implementation", "visual", "android", "ios", "live", "physical", "evidence", "nextAction"])
          assert.equal(Object.hasOwn(row, field), false, `${name}: ${row.id} retains ${field}`);
      }
    }
  }
});

test("artifact input records use a selected task output without fixed historical task names", async () => {
  const root = await mkdtemp(join(tmpdir(), "native-input-record-"));
  for (const directory of ["app", "src", "scripts", "assets", "selected-task-output"]) await mkdir(join(root, directory));
  await mkdir(join(root, "tests/criteria"), { recursive: true });
  await cp(join(repository, "scripts/artifact-inputs.mjs"), join(root, "scripts/artifact-inputs.mjs"));
  for (const file of ["app.config.ts", "package.json", "package-lock.json", "eas.json", "tsconfig.json"]) await writeFile(join(root, file), "fixture");
  const output = join(root, "selected-task-output");
  const target = join(output, "inputs.json");
  for (const mode of ["create", "verify"]) {
    const result = run(root, "scripts/artifact-inputs.mjs", mode, target, "--output-root", output);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.notEqual(run(root, "scripts/artifact-inputs.mjs", "create", target, "--output-root", output).status, 0);
  assert.notEqual(run(root, "scripts/artifact-inputs.mjs", "create", join(root, "escape.json"), "--output-root", output).status, 0);
  await writeFile(join(root, "app.config.ts"), "changed");
  assert.match(run(root, "scripts/artifact-inputs.mjs", "verify", target, "--output-root", output).stderr, /Build input drift/);
});
