import { asRecord, resourceId } from "../apps/appModel.ts";
export function jobState(value: unknown, expectedId?: string) {
  const raw = asRecord(value),
    id = resourceId(raw.job_id);
  if (expectedId && id !== expectedId)
    throw new Error("The response job did not match this request.");
  if (
    typeof raw.status !== "string" ||
    ![
      "queued",
      "running",
      "completed",
      "failed",
      "cancelled",
      "cancellation_requested",
    ].includes(raw.status)
  )
    throw new Error("The response job state could not be used.");
  return {
    id,
    status: raw.status,
    model: typeof raw.model === "string" ? raw.model : null,
    error: typeof raw.error_message === "string" ? raw.error_message : null,
  };
}
export function jobContent(value: unknown, expectedId?: string): string | null {
  if (expectedId) {
    const state = jobState(value, expectedId);
    if (state.status !== "completed")
      throw new Error("The job result is not confirmed complete.");
  }
  const raw = asRecord(value),
    result = asRecord(raw.result),
    choices = Array.isArray(result.choices) ? result.choices : [];
  const content =
    result.content ?? asRecord(asRecord(choices[0]).message).content;
  if (content == null) return null;
  if (typeof content !== "string" || content.length > 2 * 1024 * 1024)
    throw new Error("The job result exceeded the device limit.");
  return content;
}
export function upstreamJobCursor(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !/^\d{1,10}$/.test(value) ||
    Number(value) > 2147483647
  )
    return null;
  return String(Number(value));
}
