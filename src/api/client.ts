import type { CredentialStore } from "./session.ts";
import { SessionManager } from "./session.ts";
import { ApiFailure } from "./types.ts";
import type { SseEvent } from "./sse.ts";
import { SseParser } from "./sse.ts";
import { boundedJson } from "./json.ts";

export class MobileClient {
  readonly session: SessionManager;
  readonly configured: boolean;
  private origin: string;
  private installation: () => Promise<string>;
  private transport: typeof fetch;
  private logoutTokens = new Set<string>();
  private pendingLogout: Promise<void> | null = null;
  constructor(
    origin: string,
    installation: () => Promise<string>,
    store: CredentialStore,
    transport: typeof fetch = fetch,
  ) {
    this.origin = origin;
    this.installation = installation;
    this.transport = transport;
    this.configured = !!origin;
    if (origin) {
      const url = new URL(origin);
      const local = ["localhost", "127.0.0.1", "10.0.2.2", "[::1]"].includes(
        url.hostname,
      );
      if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/" ||
        (url.protocol !== "https:" && !(local && url.protocol === "http:"))
      )
        throw new Error(
          "Mobile API must be an HTTPS origin (loopback permitted for development).",
        );
    }
    this.session = new SessionManager(store, async (refreshToken) =>
      this.request(
        "/v1/auth/refresh",
        { method: "POST", body: JSON.stringify({ refreshToken }) },
        false,
      ),
    );
  }
  private async headers(authenticated: boolean, extras?: HeadersInit) {
    const headers = new Headers(extras);
    headers.set("x-openjm-installation-id", await this.installation());
    if (authenticated)
      headers.set("authorization", `Bearer ${await this.session.access()}`);
    else headers.delete("authorization");
    return headers;
  }
  private async response(
    path: string,
    options: RequestInit,
    authenticated: boolean,
  ) {
    if (!this.configured)
      throw new ApiFailure(
        503,
        "SETUP_REQUIRED",
        "Connect the app to an OpenJM mobile service to continue.",
      );
    if (
      !path.startsWith("/v1/") ||
      path.startsWith("//") ||
      path.includes("\\")
    )
      throw new Error("Invalid mobile API path");
    const url = new URL(path, this.origin);
    if (url.origin !== new URL(this.origin).origin)
      throw new Error("Invalid mobile API origin");
    const revision = this.session.revision();
    const headers = await this.headers(authenticated, options.headers);
    if (authenticated && revision !== this.session.revision())
      throw new ApiFailure(
        401,
        "SESSION_CHANGED",
        "Your session changed. Please try again.",
      );
    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers.has("content-type")
    )
      headers.set("content-type", "application/json");
    try {
      const result = await this.transport(url.toString(), {
        ...options,
        headers,
        redirect: "error",
        signal: options.signal ?? AbortSignal.timeout(30_000),
      });
      if (authenticated && revision !== this.session.revision()) {
        await result.body?.cancel().catch(() => {});
        throw new ApiFailure(
          401,
          "SESSION_CHANGED",
          "Your session changed. Please try again.",
        );
      }
      return result;
    } catch (failure) {
      if (failure instanceof ApiFailure) throw failure;
      if (options.signal?.aborted) throw failure;
      throw new ApiFailure(
        503,
        "NETWORK_UNAVAILABLE",
        "Could not connect. Check your connection and try again.",
      );
    }
  }
  async request<T = unknown>(
    path: string,
    options: RequestInit = {},
    authenticated = true,
  ): Promise<T> {
    const revision = this.session.revision();
    let response = await this.response(path, options, authenticated);
    if (
      response.status === 401 &&
      authenticated &&
      (!options.method || options.method === "GET")
    ) {
      await this.session.refresh();
      response = await this.response(path, options, authenticated);
    }
    if (response.status === 204) return undefined as T;
    const payload = (await boundedJson(response).catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (authenticated && revision !== this.session.revision())
      throw new ApiFailure(
        401,
        "SESSION_CHANGED",
        "Your session changed. Please try again.",
      );
    if (!response.ok)
      throw new ApiFailure(
        response.status,
        typeof payload?.code === "string" ? payload.code : "REQUEST_FAILED",
        typeof payload?.message === "string"
          ? payload.message
          : "The request could not be completed.",
      );
    if (!payload)
      throw new ApiFailure(
        502,
        "INVALID_RESPONSE",
        "The response could not be used.",
      );
    return (payload.status === "success" ? payload.data : payload) as T;
  }
  async binary(
    path: string,
    options: RequestInit = {},
    maxBytes = 24 * 1024 * 1024,
    authenticated = true,
  ): Promise<{ bytes: Uint8Array; contentType: string }> {
    if (
      !Number.isSafeInteger(maxBytes) ||
      maxBytes < 1 ||
      maxBytes > 24 * 1024 * 1024
    )
      throw new Error("Invalid download limit");
    const revision = this.session.revision();
    let response = await this.response(path, options, authenticated);
    if (
      response.status === 401 &&
      authenticated &&
      (!options.method || options.method === "GET")
    ) {
      await this.session.refresh();
      response = await this.response(path, options, authenticated);
    }
    if (!response.ok) {
      const payload = (await boundedJson(response).catch(() => null)) as Record<
        string,
        unknown
      > | null;
      throw new ApiFailure(
        response.status,
        typeof payload?.code === "string" ? payload.code : "DOWNLOAD_FAILED",
        typeof payload?.message === "string"
          ? payload.message
          : "The file could not be downloaded.",
      );
    }
    const length = Number(response.headers.get("content-length"));
    if (length > maxBytes) {
      await response.body?.cancel();
      throw new ApiFailure(
        413,
        "DOWNLOAD_TOO_LARGE",
        "This file is too large to download on this device.",
      );
    }
    if (!response.body) throw new Error("The download has no content.");
    const reader = response.body.getReader(),
      chunks: Uint8Array[] = [];
    let size = 0;
    const abort = () => {
      void reader.cancel().catch(() => {});
    };
    options.signal?.addEventListener("abort", abort, { once: true });
    try {
      for (;;) {
        const part = await reader.read();
        if (options.signal?.aborted) throw new Error("Download canceled.");
        if (authenticated && revision !== this.session.revision())
          throw new ApiFailure(
            401,
            "SESSION_CHANGED",
            "Your session changed. Please try again.",
          );
        if (part.done) break;
        size += part.value.byteLength;
        if (size > maxBytes)
          throw new ApiFailure(
            413,
            "DOWNLOAD_TOO_LARGE",
            "This file is too large to download on this device.",
          );
        chunks.push(part.value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return {
        bytes,
        contentType:
          response.headers
            .get("content-type")
            ?.split(";")[0]
            .trim()
            .toLowerCase() ?? "application/octet-stream",
      };
    } catch (failure) {
      if (failure instanceof ApiFailure || options.signal?.aborted) throw failure;
      throw new ApiFailure(
        503,
        "DOWNLOAD_INTERRUPTED",
        "The file download was interrupted. Try downloading again.",
      );
    } finally {
      options.signal?.removeEventListener("abort", abort);
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }
  async stream(
    path: string,
    body: unknown,
    emit: (event: SseEvent) => void,
    signal: AbortSignal,
    opened?: (streamId: string | null) => void,
    authenticated = true,
    headers?: HeadersInit,
  ) {
    const revision = this.session.revision();
    const response = await this.response(
      path,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          ...Object.fromEntries(new Headers(headers)),
          accept: "text/event-stream",
        },
        signal,
      },
      authenticated,
    );
    return this.consumeStream(
      response,
      emit,
      signal,
      opened,
      authenticated,
      revision,
    );
  }
  async resume(
    path: string,
    emit: (event: SseEvent) => void,
    signal: AbortSignal,
    cursor?: string | null,
    opened?: (streamId: string | null) => void,
  ) {
    const revision = this.session.revision();
    if (cursor && !/^\d{1,20}-\d{1,20}$/.test(cursor))
      throw new Error("Invalid conversation replay cursor");
    const options = {
      method: "GET",
      signal,
      headers: {
        accept: "text/event-stream",
        ...(cursor ? { "last-event-id": cursor } : {}),
      },
    };
    let response = await this.response(path, options, true);
    if (response.status === 401) {
      await this.session.refresh();
      response = await this.response(path, options, true);
    }
    return this.consumeStream(response, emit, signal, opened, true, revision);
  }
  async resumeJob(
    path: string,
    emit: (event: SseEvent) => void,
    signal: AbortSignal,
    cursor?: string | null,
  ) {
    if (
      !/^\/v1\/jobs\/[A-Za-z0-9_-]{1,128}\/stream$/.test(path) ||
      (cursor && (!/^\d{1,10}$/.test(cursor) || Number(cursor) > 2147483647))
    )
      throw new Error("Invalid upstream job stream cursor or path");
    const revision = this.session.revision();
    const options = {
      method: "GET",
      signal,
      headers: {
        accept: "text/event-stream",
        ...(cursor ? { "last-event-id": String(Number(cursor)) } : {}),
      },
    };
    let response = await this.response(path, options, true);
    if (response.status === 401) {
      await this.session.refresh();
      response = await this.response(path, options, true);
    }
    return this.consumeStream(
      response,
      emit,
      signal,
      undefined,
      true,
      revision,
    );
  }
  private async consumeStream(
    response: Response,
    emit: (event: SseEvent) => void,
    signal: AbortSignal,
    opened?: (streamId: string | null) => void,
    authenticated = true,
    revision = this.session.revision(),
  ) {
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/event-stream") ||
      !response.body
    ) {
      const payload = (await boundedJson(response).catch(() => null)) as Record<
        string,
        unknown
      > | null;
      throw new ApiFailure(
        response.status,
        typeof payload?.code === "string" ? payload.code : "STREAM_UNAVAILABLE",
        typeof payload?.message === "string"
          ? payload.message
          : "The response could not start.",
      );
    }
    opened?.(response.headers.get("x-openjm-stream-id"));
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let completed = false;
    const parser = new SseParser((event) => {
      if (completed) return;
      if (authenticated && revision !== this.session.revision())
        throw new ApiFailure(
          401,
          "SESSION_CHANGED",
          "Your session changed. Please try again.",
        );
      emit(event);
      if (event.data.trim() === "[DONE]") completed = true;
    });
    const abort = () => {
      void reader.cancel().catch(() => {});
    };
    signal.addEventListener("abort", abort, { once: true });
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        parser.push(decoder.decode(next.value, { stream: true }));
        if (completed) break;
      }
      parser.push(decoder.decode());
      parser.finish();
      if (!completed)
        throw new ApiFailure(
          502,
          "STREAM_INTERRUPTED",
          "The response ended before completion. Reload its saved state.",
        );
    } finally {
      signal.removeEventListener("abort", abort);
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    return response.headers.get("x-openjm-stream-id");
  }
  async logout() {
    if (this.pendingLogout) return this.pendingLogout;
    const token = this.session.snapshot()?.refreshToken;
    if (token) this.logoutTokens.add(token);
    const work = this.finishLogout();
    this.pendingLogout = work;
    try {
      await work;
    } finally {
      if (this.pendingLogout === work) this.pendingLogout = null;
    }
  }
  private async finishLogout() {
    const tokens = [...this.logoutTokens];
    const clearing = this.session.clear();
    const revoking = (async () => {
      const results = await Promise.allSettled(
        tokens.map(async (token) => {
          await this.request(
            "/v1/auth/logout",
            { method: "POST", body: JSON.stringify({ refreshToken: token }) },
            false,
          );
          this.logoutTokens.delete(token);
        }),
      );
      const failure = results.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
    })();
    const [local, remote] = await Promise.allSettled([clearing, revoking]);
    if (local.status === "rejected")
      throw new ApiFailure(
        503,
        "DEVICE_SIGNOUT_FAILED",
        remote.status === "fulfilled"
          ? "Server sign-out completed, but device credentials could not be removed. Please retry sign-out."
          : "Device credentials could not be removed and server sign-out could not be confirmed. Please retry.",
      );
    if (remote.status === "rejected")
      throw new ApiFailure(
        503,
        "REVOCATION_UNCONFIRMED",
        "Signed out on this device. Server revocation could not be confirmed.",
      );
  }
}
