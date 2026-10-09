import katex from "katex";
export function formulaHtml(source: string, displayMode = true) {
  if (source.length > 8192)
    throw new Error("The formula is too large to render.");
  return katex.renderToString(source, {
    displayMode,
    output: "htmlAndMathml",
    throwOnError: true,
    trust: false,
    strict: "error",
    maxExpand: 1000,
    maxSize: 5,
    macros: {},
  });
}
