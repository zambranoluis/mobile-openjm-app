import MarkdownIt from "markdown-it";
import type { Token } from "markdown-it";
export type RichNode = {
  type: string;
  tag: string;
  content: string;
  info: string;
  attrs: Record<string, string>;
  children: RichNode[];
};
const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: true,
  typographer: false,
});
function mathToken(env: Record<string, unknown>) {
  const prior =
    typeof env.openjmMathCount === "number" ? env.openjmMathCount : 0;
  env.openjmMathCount = prior + 1;
  return prior < 8 ? "math" : "math_source";
}
markdown.inline.ruler.before("escape", "native_math", (state, silent) => {
  const rest = state.src.slice(state.pos),
    open = rest.startsWith("\\(")
      ? "\\("
      : rest.startsWith("$$")
        ? "$$"
        : rest.startsWith("$")
          ? "$"
          : null;
  if (!open) return false;
  const close = open === "\\(" ? "\\)" : open;
  const end = rest.indexOf(close, open.length);
  if (
    end < open.length + 1 ||
    end > 8192 ||
    (open === "$" &&
      (/^\s/.test(rest.slice(1)) ||
        /\s$/.test(rest.slice(1, end)) ||
        /\d/.test(rest[end + 1] ?? "")))
  )
    return false;
  if (!silent) {
    const token = state.push(mathToken(state.env), "math", 0);
    token.content = rest.slice(open.length, end);
    token.info = open === "$$" ? "display" : "inline";
  }
  state.pos += end + close.length;
  return true;
});
markdown.block.ruler.before(
  "paragraph",
  "native_math_block",
  (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine],
      rest = state.src.slice(start),
      open = rest.startsWith("$$")
        ? "$$"
        : rest.startsWith("\\[")
          ? "\\["
          : null;
    if (!open || state.sCount[startLine] > 3) return false;
    const close = open === "\\[" ? "\\]" : "$$",
      end = rest.indexOf(close, open.length);
    if (end < open.length || end > 8192) return false;
    const last = start + end + close.length;
    let next = startLine + 1;
    while (next < endLine && state.bMarks[next] < last) next++;
    const suffix = state.src.slice(last, state.eMarks[next - 1]);
    if (suffix.trim()) return false;
    if (!silent) {
      const token = state.push(mathToken(state.env), "math", 0);
      token.content = rest.slice(open.length, end).trim();
      token.info = "display";
      token.map = [startLine, next];
    }
    state.line = next;
    return true;
  },
);
function tree(tokens: Token[]): RichNode[] {
  const root: RichNode[] = [];
  const stack = [root];
  for (const token of tokens) {
    if (token.nesting === -1) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const node: RichNode = {
      type: token.type.replace(/_open$/, ""),
      tag: token.tag,
      content: token.content,
      info: token.info,
      attrs: Object.fromEntries(
        (token.attrs ?? []).map(([name, value]) => [name, String(value)]),
      ),
      children: token.children ? tree(token.children) : [],
    };
    stack[stack.length - 1].push(node);
    if (token.nesting === 1) stack.push(node.children);
  }
  return root;
}
export function richDocument(source: string): RichNode[] {
  // Preserve oversized content as selectable text without multiplying it into a huge syntax tree.
  if (source.length > 262144)
    return [
      {
        type: "text",
        tag: "",
        content: source,
        info: "",
        attrs: {},
        children: [],
      },
    ];
  return tree(markdown.parse(source, {}));
}
export function externalLink(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password || /[\u0000-\u001f]/.test(value))
      return null;
    return ["https:", "mailto:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
