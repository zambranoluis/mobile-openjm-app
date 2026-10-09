import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appDefinition,
  configuration,
  installation,
  installationSecret,
} from "../../src/features/apps/appModel.ts";
import {
  memories,
  memoryWrite,
  graphQuery,
} from "../../src/features/account/memoryModel.ts";
test("native integration configuration follows published requirements, types, enum values and limits", () => {
  const schema = {
    required: ["vault_name"],
    properties: {
      vault_name: { type: "string", minLength: 3 },
      sync_mode: { type: "string", enum: ["manual", "auto"] },
      enabled: { type: "boolean" },
      batch: { type: "integer", minimum: 1, maximum: 10 },
    },
  };
  assert.deepEqual(
    configuration(schema, {
      vault_name: "Work",
      sync_mode: "manual",
      enabled: "true",
      batch: "5",
    }),
    { vault_name: "Work", sync_mode: "manual", enabled: true, batch: 5 },
  );
  for (const values of [
    { vault_name: "" },
    { vault_name: "aa" },
    { vault_name: "Work", sync_mode: "unknown" },
    { vault_name: "Work", batch: "11" },
    { vault_name: "Work", enabled: "1" },
  ])
    assert.throws(() => configuration(schema, values));
  assert.equal(
    appDefinition({ id: "obsidian", config_schema: schema }).schema,
    schema,
  );
  assert.equal(installation({ id: "fixture" }).enabled, null);
  assert.equal(
    installationSecret({ installation_token: "fictional-once" }),
    "fictional-once",
  );
  assert.throws(() => installationSecret({ token_prefix: "fictional-prefix" }));
});
test("memory reads reject unusable content and preserve authoritative counts and graph limits", () => {
  const item = {
    id: "memory-fixture",
    content: "Fictional saved content",
    salience: 0.4,
  };
  assert.equal(memories({ items: [item, item] }).length, 1);
  assert.throws(() => memories({ items: [{ id: "fixture" }] }));
  assert.deepEqual(memoryWrite(" Fictional ", "semantic", ""), {
    content: "Fictional",
    kind: "semantic",
  });
  assert.throws(() => memoryWrite("", "semantic", ""));
  assert.throws(() => memoryWrite("Fictional", "semantic", "NaN"));
  assert.equal(graphQuery("50", "1").toString(), "k=50&min_similarity=1");
  for (const args of [
    ["51", "0.5"],
    ["0", ""],
    ["1", "1.1"],
  ])
    assert.throws(() => graphQuery(...args));
});
