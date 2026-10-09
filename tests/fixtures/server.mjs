import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
const fictionalImage = readFileSync(
  new URL("../../assets/hummingbird.png", import.meta.url),
);
const audioSeconds = Number(process.env.OPENJM_FIXTURE_AUDIO_SECONDS ?? 30);
if (!Number.isInteger(audioSeconds) || audioSeconds < 30 || audioSeconds > 600)
  throw new Error("Invalid fixture audio duration.");
const samples = 22050 * audioSeconds,
  fictionalAudio = Buffer.alloc(44 + samples * 2);
fictionalAudio.write("RIFF", 0);
fictionalAudio.writeUInt32LE(fictionalAudio.length - 8, 4);
fictionalAudio.write("WAVEfmt ", 8);
fictionalAudio.writeUInt32LE(16, 16);
fictionalAudio.writeUInt16LE(1, 20);
fictionalAudio.writeUInt16LE(1, 22);
fictionalAudio.writeUInt32LE(22050, 24);
fictionalAudio.writeUInt32LE(44100, 28);
fictionalAudio.writeUInt16LE(2, 32);
fictionalAudio.writeUInt16LE(16, 34);
fictionalAudio.write("data", 36);
fictionalAudio.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < samples; i++)
  fictionalAudio.writeInt16LE(
    Math.round(Math.sin((i * 440 * 2 * Math.PI) / 22050) * 1000),
    44 + i * 2,
  );
let mediaJobs = [],
  fixtureFiles = [];
let publicJobs = [],
  responseJobs = [],
  profilePhoto = true;
const id = "11111111-1111-4111-8111-111111111111";
const conversation = {
  id,
  model: "fixture-chat",
  title: "Fixture conversation",
  preview: "Fictional device-test data",
  updated_at: "2026-01-01T12:00:00Z",
};
const messages = [
  {
    id: "fixture-welcome",
    role: "assistant",
    content: "This is fictional test content.",
  },
];
let refresh = 0;
let revoked = false;
let credits = 1250;
let tier = "free";
let preferences = {
  enabled: true,
  max_items: 6,
  form: true,
  web_search_enabled: false,
};
let keys = [],
  memories = [],
  installs = [],
  challenge = null,
  authorized = new Set(),
  domainChecks = 0;
const definitions = [
  {
    id: "fixture-app",
    name: "Fictional notes connector",
    description: "Deterministic local installation fixture.",
    capabilities: ["Fictional notes"],
    config_schema: {
      type: "object",
      properties: {
        vault_name: { type: "string", title: "Vault name", minLength: 3 },
        sync_mode: {
          type: "string",
          enum: ["manual", "auto"],
          default: "manual",
        },
      },
      required: ["vault_name"],
    },
  },
  {
    id: "obsidian",
    name: "Fictional Obsidian",
    description: "Fictional bridge data; no upstream connection.",
    config_schema: {
      properties: {
        vault_name: { type: "string", title: "Vault name" },
        sync_mode: { type: "string", enum: ["manual", "auto"] },
      },
    },
  },
];
function resetOperations() {
  responseJobs = [];
  profilePhoto = true;
  mediaJobs = [];
  fixtureFiles = [
    {
      file_id: "file_fixture",
      filename: "fictional-note.txt",
      content_type: "text/plain",
      bytes: 35,
      purpose: "user_data",
      expires_at: "2030-01-01T00:00:00Z",
    },
  ];
  keys = [];
  memories = [
    {
      id: "memory-fixture",
      content: "Fictional saved memory",
      kind: "semantic",
      salience: 0.4,
    },
  ];
  installs = [
    {
      id: "installation-fixture",
      app_id: "obsidian",
      enabled: true,
      status: "connected",
      config: { vault_name: "Fictional vault", sync_mode: "manual" },
    },
  ];
  challenge = null;
  authorized = new Set();
  domainChecks = 0;
}
resetOperations();
const profile = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Avery",
  lastname: "Sample",
  email: "avery@example.test",
  profileComplete: true,
  missingFields: [],
  twoFactorEnabled: true,
  phone: { areaCode: "+1", number: "5550100" },
};
function credentials() {
  return {
    accessToken: "fictional-access",
    refreshToken: `fictional-refresh-${++refresh}`,
    userId: profile.id,
    accessTokenExpiresAt: new Date(Date.now() + 600000).toISOString(),
    sessionExpiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
}
function json(response, status, payload) {
  response
    .writeHead(status, {
      "content-type": "application/json",
      "cache-control": "no-store",
    })
    .end(JSON.stringify(payload));
}
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://fixture.local");
    const path = url.pathname;
    let raw = "";
    for await (const chunk of request) {
      raw += chunk;
      if (raw.length > 1048576) {
        json(response, 413, {
          code: "TOO_LARGE",
          message: "Fixture input too large.",
        });
        return;
      }
    }
    const input =
      raw && request.headers["content-type"]?.includes("application/json")
        ? JSON.parse(raw)
        : {};
    if (path === "/v1/public/memory/session" && request.method === "DELETE") {
      publicJobs = [];
      response.writeHead(204).end();
      return;
    }
    const publicKind = path.startsWith("/v1/public/images/generations")
      ? "image"
      : path.startsWith("/v1/public/audio/music")
        ? "music"
        : null;
    if (publicKind) {
      if (request.method === "POST") {
        const job = {
          id: `public-${publicKind}-${publicJobs.length + 1}`,
          kind: publicKind,
          status: "queued",
          job_token: `fictional-${publicKind}-token-${publicJobs.length + 1}`,
        };
        publicJobs.push(job);
        json(response, 202, job);
        return;
      }
      const jobId = path.split("/")[5],
        job = publicJobs.find(
          (item) => item.id === jobId && item.kind === publicKind,
        );
      if (!job || request.headers["x-openjm-job-token"] !== job.job_token) {
        json(response, 403, {
          message: "Fictional public job token is required.",
        });
        return;
      }
      if (path.endsWith("/content")) {
        response
          .writeHead(200, {
            "content-type": publicKind === "image" ? "image/png" : "audio/wav",
          })
          .end(publicKind === "image" ? fictionalImage : fictionalAudio);
        return;
      }
      job.status = "completed";
      json(response, 200, { id: job.id, status: job.status });
      return;
    }
    if (path === "/v1/public/chat/completions" && request.method === "POST") {
      response.writeHead(200, { "content-type": "text/event-stream" });
      response.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "Fictional anonymous response." } }] })}\n\n`,
      );
      response.end("data: [DONE]\n\n");
      return;
    }
    if (request.method === "POST" && path === "/v1/auth/reset-password") {
      if (input.token !== "fictional-token") {
        json(response, 400, { message: "This fictional token is invalid." });
        return;
      }
      response.writeHead(204).end();
      return;
    }
    if (request.method === "POST" && path === "/v1/auth/login") {
      revoked = false;
      credits = 1250;
      tier = "free";
      preferences = {
        enabled: true,
        max_items: 6,
        form: true,
        web_search_enabled: false,
      };
      messages.splice(1);
      resetOperations();
      json(response, 202, {
        flow: {
          nextStep: "OTP_REQUIRED",
          challenge: {
            challengeId: "fixture-challenge",
            resendAvailableAt: new Date(Date.now() + 30000).toISOString(),
          },
        },
        credentials: null,
      });
      return;
    }
    if (request.method === "POST" && path === "/v1/auth/verify-otp") {
      if (input.code !== "123456") {
        json(response, 400, {
          code: "OTP_INVALID",
          message: "The verification code is invalid.",
        });
        return;
      }
      json(response, 200, {
        flow: { nextStep: "AUTHENTICATED", login: { userId: profile.id } },
        credentials: credentials(),
      });
      return;
    }
    if (request.method === "POST" && path === "/v1/auth/refresh") {
      if (revoked) {
        json(response, 401, {
          code: "SESSION_EXPIRED",
          message: "Please sign in again.",
        });
        return;
      }
      json(response, 200, credentials());
      return;
    }
    if (request.method === "POST" && path === "/v1/auth/logout") {
      revoked = true;
      response.writeHead(204).end();
      return;
    }
    if (!request.headers.authorization || revoked) {
      json(response, 401, {
        code: "AUTH_REQUIRED",
        message: "Please sign in.",
      });
      return;
    }
    if (path === "/v1/me/image") {
      if (request.method === "DELETE") {
        profilePhoto = false;
        response.writeHead(204).end();
        return;
      }
      if (request.method === "PUT") profilePhoto = true;
      json(
        response,
        200,
        profilePhoto
          ? { imageBase64: fictionalImage.toString("base64") }
          : { code: "PROFILE_IMAGE_NOT_FOUND" },
      );
      return;
    }
    if (path === "/v1/me" && request.method === "DELETE") {
      if (allowed("ACCOUNT_DELETE")) {
        revoked = true;
        response.writeHead(204).end();
      }
      return;
    }
    if (path === "/v1/conversations/request-mode") {
      json(response, 200, { stream: !input.document_file_ids?.length });
      return;
    }
    if (path === "/v1/conversations/complexity") {
      json(response, 200, {
        decision: "normal",
        score: 0,
        requires_confirmation: false,
        recommended_mode: "normal",
      });
      return;
    }
    if (path === `/v1/conversations/${id}/turn`) {
      json(response, 200, {
        status: messages.length > 1 ? "completed" : "not_found",
      });
      return;
    }
    if (path === `/v1/conversations/${id}/streams/active`) {
      response.writeHead(204).end();
      return;
    }
    if (path === "/v1/embeddings") {
      json(response, 200, {
        object: "list",
        model: "fixture-embeddings",
        data: [
          {
            object: "embedding",
            index: 0,
            embedding:
              input.encoding_format === "base64" ? "AAAAAA==" : [0.1, 0.2, 0.3],
          },
        ],
        usage: { prompt_tokens: 3, total_tokens: 3 },
      });
      return;
    }
    if (path === "/v1/jobs" && request.method === "POST") {
      const job = {
        job_id: `response-job-${responseJobs.length + 1}`,
        status: "queued",
        model: input.model,
      };
      responseJobs.push(job);
      json(response, 202, job);
      return;
    }
    const responseJobMatch = path.match(
      /^\/v1\/jobs\/([^/]+)(?:\/(result|stream))?$/,
    );
    if (responseJobMatch) {
      const job = responseJobs.find(
        (item) => item.job_id === responseJobMatch[1],
      );
      if (!job) {
        json(response, 404, { message: "Fictional response job not found." });
        return;
      }
      if (request.method === "DELETE") {
        job.status = "cancelled";
        json(response, 200, job);
        return;
      }
      if (responseJobMatch[2] === "stream") {
        const cursor = Number(request.headers["last-event-id"] ?? 0);
        response.writeHead(200, { "content-type": "text/event-stream" });
        if (cursor < 1)
          response.write(
            `id: 1\ndata: ${JSON.stringify({ choices: [{ delta: { content: "Fictional job result." } }] })}\n\n`,
          );
        job.status = "completed";
        response.end("id: 2\ndata: [DONE]\n\n");
        return;
      }
      if (responseJobMatch[2] === "result") {
        json(response, 200, {
          ...job,
          result:
            job.status === "completed"
              ? { content: "Fictional job result." }
              : null,
        });
        return;
      }
      if (job.status === "queued") job.status = "running";
      json(response, 200, job);
      return;
    }
    if (path === `/v1/conversations/${id}/files` && request.method === "GET") {
      json(response, 200, fixtureFiles);
      return;
    }
    if (path === "/v1/files/file_fixture/content") {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("Fictional local file sharing content.");
      return;
    }
    if (path === "/v1/files/file_fixture" && request.method === "DELETE") {
      fixtureFiles = [];
      json(response, 200, { deleted: true });
      return;
    }
    if (path === "/v1/files/file_fixture") {
      json(
        response,
        200,
        fixtureFiles[0] ?? {
          id: "file_fixture",
          filename: "fictional-note.txt",
          openjm: { content_type: "text/plain" },
        },
      );
      return;
    }
    const mediaKind = path.startsWith("/v1/images/generations")
      ? "image"
      : path.startsWith("/v1/audio/music")
        ? "music"
        : null;
    if (mediaKind && request.method === "POST") {
      const item = {
        kind: mediaKind,
        id:
          mediaKind === "music"
            ? input.request_id
            : `image-fixture-${mediaJobs.length + 1}`,
        status: "queued",
        submission_state: mediaKind === "music" ? "accepted" : undefined,
        image_id: null,
        reads: 0,
        prompt: input.prompt,
      };
      mediaJobs.push(item);
      json(response, 202, item);
      return;
    }
    if (path.startsWith("/v1/images/") && path.endsWith("/content")) {
      response
        .writeHead(200, { "content-type": "image/png" })
        .end(fictionalImage);
      return;
    }
    if (mediaKind && request.method === "GET") {
      const parts = path.split("/"),
        jobId = parts[4],
        item = mediaJobs.find(
          (value) => value.kind === mediaKind && value.id === jobId,
        );
      if (!item) {
        json(response, 404, { message: "Fictional media job not found." });
        return;
      }
      if (path.endsWith("/content")) {
        response
          .writeHead(200, { "content-type": "audio/wav" })
          .end(fictionalAudio);
        return;
      }
      item.reads++;
      if (item.reads >= 2) {
        item.status = "completed";
        if (mediaKind === "image")
          item.image_id = "33333333-3333-4333-8333-333333333333";
      }
      json(response, 200, item);
      return;
    }
    if (request.method === "GET" && path === "/v1/me") {
      json(response, 200, profile);
      return;
    }
    if (
      path.startsWith("/v1/me/security/sensitive-actions/") &&
      request.method === "POST"
    ) {
      if (path.endsWith("/verify")) {
        if (
          !challenge ||
          input.challengeId !== "fictional-sensitive" ||
          input.code !== "123456"
        ) {
          json(response, 400, { message: "The fictional code is invalid." });
          return;
        }
        authorized.add(`${challenge.action}:${challenge.resourceId ?? ""}`);
        response.writeHead(204).end();
        return;
      }
      if (path.endsWith("/request")) challenge = input;
      json(response, 200, {
        challengeId: "fictional-sensitive",
        destinationHint: "a***@example.test",
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        resendAvailableAt: new Date(Date.now() - 1000).toISOString(),
      });
      return;
    }
    function allowed(action, resource = "") {
      const key = `${action}:${resource}`;
      if (authorized.delete(key)) return true;
      json(response, 403, { message: "Fictional verification is required." });
      return false;
    }
    if (path === "/v1/users/me/export" && request.method === "GET") {
      if (allowed("ACCOUNT_EXPORT"))
        json(response, 200, { profile, messages, fixture: true });
      return;
    }
    if (path === "/v1/keys" && request.method === "GET") {
      json(response, 200, {
        data: keys.filter(
          (key) =>
            key.is_revoked === (url.searchParams.get("status") === "revoked"),
        ),
        has_more: false,
        next_cursor: null,
      });
      return;
    }
    if (path === "/v1/keys" && request.method === "POST") {
      const key = {
        id: `key-fixture-${keys.length + 1}`,
        key_prefix: "fictional-prefix",
        scopes: input.scopes,
        is_revoked: false,
        ...input,
      };
      keys.push(key);
      json(response, 201, { ...key, api_key: "fictional-key-one-time" });
      return;
    }
    const keyMatch = path.match(/^\/v1\/keys\/([^/]+)(\/revoke)?$/);
    if (keyMatch) {
      const key = keys.find((key) => key.id === keyMatch[1]);
      if (!key) {
        json(response, 404, { message: "Fictional key not found." });
        return;
      }
      if (!allowed(keyMatch[2] ? "API_KEY_REVOKE" : "API_KEY_UPDATE", key.id))
        return;
      if (keyMatch[2]) {
        key.is_revoked = true;
        response.writeHead(204).end();
      } else {
        Object.assign(key, input);
        json(response, 200, key);
      }
      return;
    }
    if (path.startsWith("/v1/domains/")) {
      const domain =
        input.domain ??
        decodeURIComponent(path.split("/")[4] ?? "example.test");
      const dns = {
        domain,
        challenge_id: "fictional-domain",
        dns_record_name: `_openjm.${domain}`,
        dns_record_type: "TXT",
        dns_record_value: "fictional-dns-value",
        expires_at: "2027-01-01T00:00:00Z",
      };
      if (path.endsWith("/verify")) domainChecks++;
      json(response, 200, {
        ...dns,
        status: domainChecks >= 2 ? "verified" : "pending",
      });
      return;
    }
    if (path === "/v1/memory" && request.method === "GET") {
      json(response, 200, { items: memories });
      return;
    }
    if (path === "/v1/memory" && request.method === "POST") {
      const item = { ...input, id: `memory-fixture-${memories.length + 1}` };
      memories.push(item);
      json(response, 201, item);
      return;
    }
    if (path === "/v1/memory/usage") {
      json(response, 200, {
        plan: "fictional",
        item_count: memories.length,
        max_items: 50,
        total_bytes: 250,
        max_bytes: 10000,
      });
      return;
    }
    if (path === "/v1/memory/search") {
      json(response, 200, {
        results: memories.filter((item) =>
          item.content
            .toLowerCase()
            .includes((url.searchParams.get("q") ?? "").toLowerCase()),
        ),
      });
      return;
    }
    if (path === "/v1/memory/graph") {
      json(response, 200, { nodes: memories, edges: [] });
      return;
    }
    if (path.endsWith("/neighbors") && path.startsWith("/v1/memory/")) {
      json(response, 200, { neighbors: memories });
      return;
    }
    if (path === "/v1/memory/export") {
      json(response, 200, { items: memories });
      return;
    }
    if (path === "/v1/memory" && request.method === "DELETE") {
      if (allowed("MEMORY_DELETE_ALL")) {
        memories = [];
        json(response, 200, { deleted: true });
      }
      return;
    }
    if (path.startsWith("/v1/memory/") && request.method === "DELETE") {
      const target = path.split("/")[3];
      if (allowed("MEMORY_ITEM_DELETE", target)) {
        memories = memories.filter((item) => item.id !== target);
        response.writeHead(204).end();
      }
      return;
    }
    if (
      request.method === "GET" &&
      path === `/v1/conversations/${id}/streams/active`
    ) {
      response.writeHead(204).end();
      return;
    }
    if (request.method === "GET" && path === "/v1/notifications/status") {
      json(response, 200, { available: false, registered: false });
      return;
    }
    if (request.method === "GET" && path === "/v1/me/2fa") {
      json(response, 200, {
        enabled: profile.twoFactorEnabled,
        method: "EMAIL",
        managedByUpstream: false,
      });
      return;
    }
    if (request.method === "PUT" && path === "/v1/me") {
      profile.name = input.name;
      profile.lastname = input.lastname;
      profile.phone = input.phone;
      json(response, 200, {
        nextStep: "UPDATED",
        user: profile,
        challenge: null,
      });
      return;
    }
    if (
      request.method === "PATCH" &&
      path === `/v1/conversations/${id}/model`
    ) {
      conversation.model = input.model;
      json(response, 200, conversation);
      return;
    }
    if (
      request.method === "PATCH" &&
      path === `/v1/conversations/${id}/group`
    ) {
      conversation.group_id = input.group_id;
      json(response, 200, conversation);
      return;
    }
    if (request.method === "GET" && path === "/v1/models") {
      json(response, 200, {
        data: [
          {
            id: "fixture-chat",
            status: "available",
            capabilities: { kind: "chat" },
          },
          {
            id: "fixture-embeddings",
            status: "available",
            capabilities: { kind: "embeddings" },
          },
          {
            id: "fixture-image",
            status: "available",
            capabilities: { kind: "image" },
          },
          {
            id: "openjm-music-1",
            status: "available",
            capabilities: { kind: "music" },
          },
        ],
      });
      return;
    }
    if (request.method === "GET" && path === "/v1/conversations") {
      json(response, 200, {
        data: [conversation],
        has_more: false,
        next_cursor: null,
      });
      return;
    }
    if (request.method === "GET" && path === `/v1/conversations/${id}`) {
      json(response, 200, {
        ...conversation,
        messages,
        generated_images: mediaJobs
          .filter(
            (item) => item.kind === "image" && item.status === "completed",
          )
          .map((item) => ({ image_id: item.image_id, prompt: item.prompt })),
        generated_music: mediaJobs.filter((item) => item.kind === "music"),
        has_more: false,
        next_cursor: null,
      });
      return;
    }
    if (
      request.method === "POST" &&
      path === `/v1/conversations/${id}/messages`
    ) {
      const text = input.content?.includes("formula")
        ? "Fictional formula:\n\n$$\n\\frac{1}{2}+x^2\n$$"
        : "Fixture response received.";
      messages.push(
        {
          id: `fixture-user-${messages.length}`,
          role: "user",
          content: input.content,
        },
        {
          id: `fixture-assistant-${messages.length}`,
          role: "assistant",
          content: text,
        },
      );
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        "x-openjm-stream-id": "fictional-stream",
      });
      response.write(
        "data: " +
          JSON.stringify({ choices: [{ delta: { content: text } }] }) +
          "\n\n",
      );
      response.end("data: [DONE]\n\n");
      return;
    }
    if (request.method === "GET" && path === "/v1/apps") {
      json(response, 200, definitions);
      return;
    }
    if (path === "/v1/apps/installations") {
      json(response, 200, installs);
      return;
    }
    const installMatch = path.match(
      /^\/v1\/apps\/installations\/([^/]+)(?:\/(.*))?$/,
    );
    if (installMatch) {
      const item = installs.find((value) => value.id === installMatch[1]);
      if (!item) {
        json(response, 404, { message: "Fictional installation not found." });
        return;
      }
      if (installMatch[2] === "rotate-secret") {
        if (allowed("APP_INSTALLATION_SECRET_ROTATE", item.id))
          json(response, 200, {
            installation_token: "fictional-rotated-token",
          });
        return;
      }
      if (request.method === "DELETE") {
        if (allowed("APP_INSTALLATION_DELETE", item.id)) {
          installs = installs.filter((value) => value.id !== item.id);
          response.writeHead(204).end();
        }
        return;
      }
      if (installMatch[2] === "obsidian/status") {
        json(response, 200, { status: "connected", vault: "Fictional vault" });
        return;
      }
      if (installMatch[2] === "status") {
        json(response, 200, {
          status: item.enabled ? "connected" : "disabled",
        });
        return;
      }
      if (request.method === "PATCH") Object.assign(item, input);
      json(response, 200, item);
      return;
    }
    const appMatch = path.match(/^\/v1\/apps\/([^/]+)(\/install)?$/);
    if (appMatch) {
      const definition = definitions.find((value) => value.id === appMatch[1]);
      if (!definition) {
        json(response, 404, { message: "Fictional app not found." });
        return;
      }
      if (appMatch[2]) {
        const item = {
          id: `installation-fixture-${installs.length + 1}`,
          app_id: definition.id,
          config: input.config,
          enabled: true,
          status: "connected",
        };
        installs.push(item);
        json(response, 201, {
          ...item,
          installation_token: "fictional-installation-one-time",
        });
      } else json(response, 200, definition);
      return;
    }
    if (request.method === "GET" && path === "/v1/credits") {
      json(response, 200, {
        summary: { balance_cents: credits, currency: "usd" },
      });
      return;
    }
    if (request.method === "GET" && path === "/v1/me/plan") {
      json(response, 200, {
        name: "Fictional test plan",
        tier,
        status: "active",
      });
      return;
    }
    if (request.method === "GET" && path === "/v1/me/plans") {
      json(response, 200, {
        plans: [
          {
            tier: "regular",
            name: "Fictional Regular",
            price_cents: 500,
            currency: "usd",
            interval: "month",
            weekly_hours: 42,
            current: tier === "regular",
            purchasable: tier === "free",
            purchase_endpoint: "/v1/me/plan/purchase",
            features: { documents: true },
          },
        ],
      });
      return;
    }
    if (request.method === "POST" && path === "/v1/credits/redeem") {
      if (input.code !== "ABCDEFGH0123") {
        json(response, 422, {
          message: "This fictional gift card is invalid.",
        });
        return;
      }
      credits += 100;
      json(response, 200, {
        credited_cents: 100,
        balance_cents: credits,
        card_id: "fictional-card",
      });
      return;
    }
    if (request.method === "POST" && path === "/v1/me/plan/purchase") {
      if (input.tier !== "regular" || tier !== "free" || credits < 500) {
        json(response, 409, { message: "Fictional purchase unavailable." });
        return;
      }
      credits -= 500;
      tier = "regular";
      json(response, 200, { tier, status: "active" });
      return;
    }
    if (request.method === "GET" && path === "/v1/me/memory-preferences") {
      json(response, 200, preferences);
      return;
    }
    if (request.method === "PATCH" && path === "/v1/me/memory-preferences") {
      if (
        typeof input.enabled !== "boolean" ||
        !Number.isInteger(input.max_items) ||
        input.max_items < 1 ||
        input.max_items > 50
      ) {
        json(response, 400, { message: "Invalid fictional preference." });
        return;
      }
      preferences = { ...input, form: input.enabled && input.form };
      json(response, 200, preferences);
      return;
    }
    if (request.method === "GET" && path === "/v1/usage/details") {
      json(response, 200, {
        data: [
          {
            id: "fictional-usage",
            model: "fixture-chat",
            created_at: "2026-01-01T00:00:00Z",
            kind: "chat",
            tier: "free",
            total_tokens: 125,
            token_source: "upstream",
            finish_reason: "stop",
            conversation_id: id,
          },
        ],
        has_more: false,
        next_offset: 1,
        is_partial: false,
      });
      return;
    }
    if (request.method === "GET" && path === "/v1/usage") {
      json(response, 200, {
        total_requests: 3,
        total_tokens: 125,
        data: [{ model: "fixture-chat", total_requests: 3, total_tokens: 125 }],
      });
      return;
    }
    if (request.method === "GET" && path === "/v1/groups") {
      json(response, 200, []);
      return;
    }
    json(response, 501, {
      code: "FIXTURE_NOT_IMPLEMENTED",
      message: "This operation is outside the local fixture journey.",
    });
  } catch {
    json(response, 400, {
      code: "INVALID_FIXTURE_REQUEST",
      message: "The fixture request is invalid.",
    });
  }
});
server.listen(8097, "127.0.0.1", () =>
  console.log(
    "FICTIONAL fixture service: 127.0.0.1:8097. No upstream connection exists.",
  ),
);
for (const event of ["SIGTERM", "SIGINT"])
  process.on(event, () => server.close(() => process.exit(0)));
