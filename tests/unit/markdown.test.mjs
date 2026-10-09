import test from "node:test";
import assert from "node:assert/strict";
import { richDocument, externalLink } from "../../src/ui/markdownModel.ts";
test("native Markdown preserves headings, lists, code, tables and inline emphasis without executing HTML", () => {
  const source =
    "# Title\n\n**Important** and [guide](https://example.test/guide).\n\n- first\n- second\n\n```ts\nconst value = 1;\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<script>alert(1)</script>";
  const document = richDocument(source);
  assert.deepEqual(
    document.slice(0, 5).map((node) => node.type),
    ["heading", "paragraph", "bullet_list", "fence", "table"],
  );
  assert.equal(document[3].content, "const value = 1;\n");
  assert.equal(document[5].type, "paragraph");
  assert.equal(
    document[5].children[0].children[0].content,
    "<script>alert(1)</script>",
  );
  const large = "long ".repeat(60000);
  assert.equal(richDocument(large)[0].content, large);
});
test("user-triggered rich links reject credentials, scripts, cleartext and device schemes", () => {
  assert.equal(
    externalLink("https://example.test/guide"),
    "https://example.test/guide",
  );
  assert.equal(
    externalLink("mailto:help@example.test"),
    "mailto:help@example.test",
  );
  for (const url of [
    "javascript:alert(1)",
    "http://example.test",
    "file:///private",
    "openjm://private",
    "https://secret@example.test",
    "/relative",
  ])
    assert.equal(externalLink(url), null);
});
