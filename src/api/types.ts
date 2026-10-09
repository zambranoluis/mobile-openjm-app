export type Credentials = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  sessionExpiresAt: string;
  userId: string;
};
export type Profile = {
  id: string;
  name: string | null;
  lastname: string | null;
  email: string;
  profileComplete: boolean;
  missingFields: string[];
  twoFactorEnabled: boolean;
  phone?: { areaCode: string; number: string } | null;
};
export type LoginFlow = {
  flow: {
    nextStep:
      | "AUTHENTICATED"
      | "PROFILE_COMPLETION_REQUIRED"
      | "OTP_REQUIRED"
      | "UPSTREAM_TOTP_REQUIRED";
    login?: { userId: string };
    challenge?: { challengeId: string; resendAvailableAt?: string };
    upstreamMfaChallenge?: string;
  };
  credentials?: Credentials | null;
};
export type Conversation = {
  id: string;
  title: string | null;
  preview: string | null;
  model: string | null;
  updated_at: string;
  group_id?: string | null;
};
export type Message = {
  id: string;
  role: string;
  content: string;
  job_id?: string | null;
  job_status?: string | null;
};
export type ConversationDetail = Conversation & {
  messages: Message[];
  has_more: boolean;
  next_cursor: string | null;
};
export type Model = {
  id: string;
  status?: string;
  loaded?: boolean;
  capabilities?: {
    kind?: string;
    reasoning?: boolean;
    agentic?: boolean;
    vision?: boolean;
    memory?: boolean;
    web_search?: boolean;
  };
};

export class ApiFailure extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiFailure";
    this.status = status;
    this.code = code;
  }
}

export function credentials(value: unknown): Credentials {
  if (!value || typeof value !== "object")
    throw new ApiFailure(
      502,
      "INVALID_RESPONSE",
      "The session response could not be used.",
    );
  const data = value as Record<string, unknown>;
  for (const key of [
    "accessToken",
    "refreshToken",
    "userId",
    "accessTokenExpiresAt",
    "sessionExpiresAt",
  ]) {
    if (typeof data[key] !== "string" || !data[key])
      throw new ApiFailure(
        502,
        "INVALID_RESPONSE",
        "The session response could not be used.",
      );
  }
  if (
    !Number.isFinite(Date.parse(String(data.accessTokenExpiresAt))) ||
    !Number.isFinite(Date.parse(String(data.sessionExpiresAt)))
  )
    throw new ApiFailure(
      502,
      "INVALID_RESPONSE",
      "The session expiry could not be used.",
    );
  return data as Credentials;
}

export function profile(value: unknown): Profile {
  if (!value || typeof value !== "object")
    throw new ApiFailure(
      502,
      "INVALID_RESPONSE",
      "The account response could not be used.",
    );
  const data = value as Record<string, unknown>;
  if (data.phone !== undefined && data.phone !== null) {
    const phone = data.phone as Record<string, unknown>;
    if (
      typeof phone !== "object" ||
      typeof phone.areaCode !== "string" ||
      typeof phone.number !== "string"
    )
      throw new ApiFailure(
        502,
        "INVALID_RESPONSE",
        "The account phone could not be used.",
      );
  }
  if (
    typeof data.id !== "string" ||
    !data.id ||
    typeof data.email !== "string" ||
    typeof data.profileComplete !== "boolean" ||
    typeof data.twoFactorEnabled !== "boolean" ||
    !Array.isArray(data.missingFields) ||
    !data.missingFields.every((field) => typeof field === "string")
  )
    throw new ApiFailure(
      502,
      "INVALID_RESPONSE",
      "The account response could not be used.",
    );
  if (
    (data.name !== null && typeof data.name !== "string") ||
    (data.lastname !== null && typeof data.lastname !== "string")
  )
    throw new ApiFailure(
      502,
      "INVALID_RESPONSE",
      "The account response could not be used.",
    );
  return data as Profile;
}

export function loginFlow(value: unknown): LoginFlow {
  const invalid = () =>
    new ApiFailure(
      502,
      "INVALID_RESPONSE",
      "The sign-in response could not be used.",
    );
  if (!value || typeof value !== "object") throw invalid();
  const result = value as LoginFlow;
  const step = result.flow?.nextStep;
  if (
    ![
      "AUTHENTICATED",
      "PROFILE_COMPLETION_REQUIRED",
      "OTP_REQUIRED",
      "UPSTREAM_TOTP_REQUIRED",
    ].includes(step)
  )
    throw invalid();
  if (step === "OTP_REQUIRED" || step === "UPSTREAM_TOTP_REQUIRED") {
    if (result.credentials) throw invalid();
    if (
      step === "OTP_REQUIRED" &&
      (!result.flow.challenge ||
        typeof result.flow.challenge.challengeId !== "string" ||
        !result.flow.challenge.challengeId)
    )
      throw invalid();
    if (
      step === "UPSTREAM_TOTP_REQUIRED" &&
      (typeof result.flow.upstreamMfaChallenge !== "string" ||
        !result.flow.upstreamMfaChallenge)
    )
      throw invalid();
  } else {
    const issued = credentials(result.credentials);
    if (result.flow.login?.userId !== issued.userId) throw invalid();
  }
  return result;
}
