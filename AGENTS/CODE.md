# Code and verification

## Ownership

`app/` contains thin Expo Router entries. `src/features/` owns product behavior; `src/ui/` owns reusable native controls and tokens; `src/platform/` owns device storage, notifications, files and external browser adapters; `src/api/` owns the versioned transport client and contract snapshot. Features consume explicit APIs, not sibling source or browser DOM/CSS. OpenJM owns models, quota, credits, plans and upstream decisions. Spring owns authentication, authorization, persistence, shared replay and jobs. The mobile gateway owns versioned transport adaptation; the app owns presentation, drafts and device lifecycle.

Keep TypeScript strict. Validate untrusted payloads at the boundary, preserve status/code/state distinctions, authorize before side effects, and avoid automatic retries of non-idempotent operations. Refresh attempts are serialized. Access credentials stay in memory; refresh credentials use SecureStore. Isolate local drafts by authoritative account ID. Installation context is stable across upgrades and network changes. Never embed proxy secrets, upstream keys or credentials in public Expo configuration, builds, logs or recorded fixtures.

Streaming must handle split UTF-8, split lines, CRLF, event framing, resume IDs, cancellation and bounded buffers. Conversation replay and upstream job cursors have different meanings. Background/reopen reconciles server state and never automatically resubmits a message. Hosted checkout return triggers authoritative account refresh; a URL is not payment proof.

## Verification

Every change needs diff review and `git diff --check`. Documentation changes need `npm run docs:check`; regenerate provider adapters and check drift after canonical changes. Application changes need `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:unit`, `npm run contract:check`, and the relevant installed-app lane. Dependencies/configuration need `npx expo install --check`, `npx expo-doctor`, and an export or native build exercising the changed mechanism. Use `npm ci` to reproduce pinned installs.

Security and cross-repository changes also need the owning gateway and Spring tests and affected web checks. Concurrency/replay acceptance requires real Redis; fixture tests are not persistence proof. A migration needs migration and persistence coverage. Never lower a gate or label a blocked check passed. Native visual and lifecycle claims require emulator/device evidence on both platforms as [tests/README.md](../tests/README.md) defines.
