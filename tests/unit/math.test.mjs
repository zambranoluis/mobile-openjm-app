import { test } from "node:test";
import assert from "node:assert/strict";
import { formulaHtml } from "../../src/ui/mathModel.ts";
import { richDocument } from "../../src/ui/markdownModel.ts";
function collect(nodes) {
  return nodes.flatMap((node) => [node, ...collect(node.children)]);
}
test("math rendering has no trusted URLs, shared macros or unbounded expansion", () => {
  const html = formulaHtml("\\frac{1}{2}+x^2");
  assert(html.includes("<math"));
  assert(html.includes("katex-html"));
  assert(
    !/<a\b|<img\b|<script\b/.test(
      formulaHtml("\\href{https://unexpected.example}{click}"),
    ),
  );
  assert.throws(() => formulaHtml("\\def\\a{\\a}\\a"));
  assert.throws(() => formulaHtml("x".repeat(8193)));
  assert(
    !formulaHtml("\\text{<script>alert(1)</script>}").includes("<script>"),
  );
});
test("math delimiters parse outside code and incomplete formulas remain readable text", () => {
  const nodes = collect(
    richDocument(
      "Inline $x^2$ and display:\n\n$$\n\\frac{1}{2}\n$$\n\n`$not math$`",
    ),
  );
  assert.equal(nodes.filter((node) => node.type === "math").length, 2);
  assert.equal(
    collect(richDocument("Incomplete $$x")).filter(
      (node) => node.type === "math",
    ).length,
    0,
  );
  assert.equal(
    collect(richDocument("Cost $10 or $20")).filter(
      (node) => node.type === "math",
    ).length,
    0,
  );
});
test("long responses bound native formula widgets and retain every additional formula as source", () => {
  const nodes = collect(
    richDocument(
      Array.from({ length: 20 }, (_, index) => `$$x_{${index}}$$`).join("\n\n"),
    ),
  );
  assert.equal(nodes.filter((node) => node.type === "math").length, 8);
  assert.equal(nodes.filter((node) => node.type === "math_source").length, 12);
});
