export type SseEvent = { event: string; data: string; id: string | null };

/** Incremental line parser; partial CRLF and UTF-8 decoding are handled across chunks. */
export class SseParser {
  private buffer = "";
  private data: string[] = [];
  private event = "message";
  private id: string | null = null;
  private size = 0;
  private emit: (event: SseEvent) => void;
  private maxBytes: number;
  constructor(emit: (event: SseEvent) => void, maxBytes = 262_144) {
    this.emit = emit;
    this.maxBytes = maxBytes;
  }
  push(chunk: string) {
    this.buffer += chunk;
    for (;;) {
      const match = /\r\n|\n|\r/.exec(this.buffer);
      if (!match) break;
      if (match[0] === "\r" && match.index === this.buffer.length - 1) break;
      const line = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      this.size += new TextEncoder().encode(line).length + match[0].length;
      if (this.size > this.maxBytes)
        throw new Error("The response event exceeded the allowed size.");
      this.line(line);
    }
    if (
      this.size + new TextEncoder().encode(this.buffer).length >
      this.maxBytes
    )
      throw new Error("The response event exceeded the allowed size.");
  }
  private line(line: string) {
    if (!line) {
      if (this.data.length)
        this.emit({
          event: this.event,
          data: this.data.join("\n"),
          id: this.id,
        });
      this.data = [];
      this.event = "message";
      this.size = 0;
      return;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const key = colon < 0 ? line : line.slice(0, colon);
    const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (key === "data") this.data.push(value);
    else if (key === "event") this.event = value;
    else if (key === "id" && !value.includes("\0")) this.id = value;
  }
  finish() {
    if (this.buffer === "\r") {
      this.buffer = "";
      this.line("");
    }
    // SSE dispatch requires a blank separator; incomplete data is never fabricated as a complete event.
  }
}
