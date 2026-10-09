export function resetToken(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const text = input.trim();
  if (!text || text.length > 8192) return null;
  const valid = (token: string) =>
    token.length <= 4096 && !/[\s\u0000-\u001f\u007f]/.test(token);
  if (!text.includes("://")) return valid(text) ? text : null;
  try {
    const url = new URL(text);
    if (
      !["https:", "openjm:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hash ||
      url.searchParams.getAll("token").length !== 1
    )
      return null;
    const token = url.searchParams.get("token");
    return token && valid(token) ? token : null;
  } catch {
    return null;
  }
}
