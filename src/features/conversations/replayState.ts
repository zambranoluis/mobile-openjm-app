import { ApiFailure } from "../../api/types.ts";
export type ActiveResponse = {
  streamId: string;
  clientSubmissionId: string;
  conversationId: string;
  status: "connecting" | "streaming" | "completed" | "failed";
};
export function activeResponse(
  value: unknown,
  conversationId: string,
): ActiveResponse | null {
  if (value === undefined) return null;
  const state = value as Partial<ActiveResponse> | null;
  if (
    !state ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(
      state.streamId ?? "",
    ) ||
    state.conversationId !== conversationId ||
    typeof state.clientSubmissionId !== "string" ||
    !["connecting", "streaming", "completed", "failed"].includes(
      state.status ?? "",
    )
  )
    throw new ApiFailure(
      502,
      "INVALID_RESPONSE",
      "The response state could not be used.",
    );
  return state as ActiveResponse;
}
