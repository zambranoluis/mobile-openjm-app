/** Account exports may be large; ordinary JSON never grows without a device limit. */
export async function boundedJson(
  response: Response,
  maxBytes = 16 * 1024 * 1024,
): Promise<unknown> {
  if (!response.body) return null;
  const declared = Number(response.headers.get("content-length"));
  if (declared > maxBytes) {
    await response.body.cancel();
    throw new Error("JSON response exceeds the device limit.");
  }
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let size = 0,
    text = "";
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes)
        throw new Error("JSON response exceeds the device limit.");
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
