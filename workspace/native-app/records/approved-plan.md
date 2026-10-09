# Approved implementation scope

The user supplied and authorized this plan on 2026-10-08. This record retains the architecture, all stages, acceptance and boundaries; execution results belong in the main plan and capability matrix. The planning claim that Plan Mode prevents writes no longer applies.

## Architecture

Build Android and iPhone clients in `mobile-openjm-app` using Expo SDK 57, React Native, TypeScript, Expo Router and npm with pinned lockfiles. Keep route entries thin, features separate and device behavior behind adapters. Top-level navigation is Conversations (history/new chat), Apps, and Account (profile, credits, billing, usage, configuration, legal). Preserve OpenJM identity, authoritative capability choices, available languages and approved assets; adapt navigation, controls, safe areas, typography, keyboard and gestures to each OS. Persist account-isolated drafts. Processing is online and reopen reconciles authoritative state.

The website retains its web gateway. Native clients use a separate TypeScript/Fastify gateway in backend `mobile-gateway/`, independently built/deployed. Both gateways call protected Spring, which owns shared authentication, conversations, replay, jobs, persistence and completion notification delivery. Spring uses Redis replay, PostgreSQL and the upstream OpenJM services. Mobile does not depend on website availability. Only the gateway origin is public mobile configuration; upstream/proxy secrets stay on servers.

## Mobile boundary and authentication

Own a versioned `/v1` specification in the gateway; retain a snapshot and typed client in mobile and check compatibility without sibling imports. Use explicit mappings, validation, bounded uploads and operation-appropriate JSON/binary/SSE. Include health/readiness, correlation and ordinary-log redaction of credentials, session tokens, sensitive values and conversation content.

Add separately gateway-protected native Spring authentication endpoints that reuse auth, MFA, profile-completion, session and revocation services. Issue native access/refresh only after required authentication steps. Preserve browser cookies unchanged. Native uses bearer access in memory, refresh in SecureStore and serialized refresh. Rotate refresh atomically; preserve server expiry, sensitive-action authorization, upstream reauthentication and logout. Bind native sessions to stable installation context across updates/network changes, without changing web policies.

## Shared streaming and jobs

Move reservation, replay, producer lifecycle and stream authorization from Next.js to Spring. Both gateways consume it. Preserve web stream IDs, SSE framing, resume cursors, submission IDs and active-stream conflicts. Expose shared active/replay endpoints so web/mobile can attach to the same response without resubmitting. Conversation replay and upstream job cursors remain distinct. Preserve existing job execution/status/result/cancellation contracts.

Real Redis is required for concurrency/replay acceptance. Backend interruption must leave recoverable truthful state; replay does not promise synchronous upstream execution survives every restart. Drain legacy producers, retain old replay through retention, and preserve web resume during cutover. Do not migrate traffic without those checks.

## Purchases and notifications

Private builds open hosted checkout in the system browser and refresh authoritative balance/plan/subscription on return. A URL never proves payment. Include opt-in completion/failure alerts: authenticated device registration, backend tracking of relevant jobs, persistent outbox, Expo Push delivery, deduplicated attempts, receipt processing and invalid/logout registration cleanup. Notification links open the correct authenticated conversation/result.

## Stages and closure

| Stage | Deliverable and required closure |
| --- | --- |
| 1 | Independent local instructions, product/design owners, workspace record, operation capability matrix, Expo scaffold, commands/testing. Documentation/scaffold checks pass; loading evidence remains distinct from completeness. |
| 2 | Native sessions, mobile API, shared replay and web migration. Auth, authorization, concurrency, replay and affected web regressions pass. |
| 3 | Registration/recovery completion, login/MFA, profile completion, history/groups, model selection, rich streaming, drafts, jobs, attachments/reconnect. Demonstrate one live response shared between web and mobile. |
| 4 | Profile/security, credits/checkout/redemption, plans/subscriptions, usage/export, memory/preferences, domains/keys, apps/Obsidian, conditional image/video/music/voice, anonymous chat and legal. Every matrix operation has native behavior and evidence. |
| 5 | Push registration/delivery, authenticated deep links, permissions, background/reopen, sharing/downloads, media, accessibility and large text on both platforms. |
| 6 | Staging, Android APK and signed private iOS builds, installation guide, artifact manifest, retained verification, deployment configuration and rollback. Public stores remain separate. |

Before implementation, map each web operation to backend contract, native screen, stage and acceptance. Distinguish actual implementation from aspiration and conditional upstream availability. Each stage closes only when its applicable checks pass, with limits recorded.

## Independent instruction system

Mobile owns `AGENTS.md` entry/routing/authority/boundaries/workspace/reporting, local investigation/planning/code/layers/native design/maintenance owners, product/design requirements and testing. Standing guidance works without web checkout, previous conversations, memory, personal skills or workspace records. Sibling sources are conditional evidence, never authority to edit them. Separate mobile-only and coordinated scope.

Use AGENTS for Codex/OpenCode, CLAUDE import and generated Copilot adapter. Check links/drift and validate actual loading separately from completeness. Track durable workspace records; ignore secrets, generated runs, previews/builds. Approved visual baselines stay in test locations. Save investigation, complete plan, matrix, prerequisites, actual checks and resume state here; keep backend implementation details with that owner.

## Required verification

Jest/jest-expo/RNTL cover components/hooks. Node tests cover gateway/utilities/contracts/SSE/deduplication. Maestro covers installed Android/iOS journeys/screenshots. Spring covers controllers/sessions/persistence/Redis/jobs/notifications. Existing Playwright covers affected browser contracts/behavior. Physical devices cover keyboard/permissions/background/notifications/media/install.

Separate deterministic fictional fixture and designated live integration lanes. Pin screenshot phone/OS/theme/locale/font scale; wait for settled rendering; inspect differences before approving baseline changes. EAS may run Maestro for both OSes.

Required scenarios:

- Login/MFA, profile completion, restart, refresh races, expiry, revocation/logout.
- Unauthorized conversation/job access and credential/secret failure handling.
- Duplicate submissions, simultaneous web/mobile sends, shared active attachment, replay expiry, Redis/backend interruption.
- Wi-Fi/data changes, background/reopen, interrupted uploads, denied permissions, cancellation/result retrieval.
- Checkout cancellation/pending/authoritative completion.
- Push denial, duplicate events, invalid registrations, logout and authenticated links.
- Small phones, large text, safe areas, long responses, visible keyboard, screen readers and reduced motion.
- Every matrix operation and affected web regressions.

## Prerequisites and boundaries

Start with phones, private/local testing then staging. Public stores, store billing and tablet-specific layouts are deferred. Verify/install required Android/Maestro/EAS tooling. Secure configuration supplies Expo/EAS access/project, Apple signing, QA accounts, staging HTTPS, push credentials and tester devices. Prepare deployment/rollback, but hosting and Git publication require explicit direction. Do not stage/commit/push/deploy or edit upstream API documentation. Preserve unrelated changes/services/artifacts.

Plan references: [Expo 57](https://docs.expo.dev/versions/v57.0.0/), [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [Expo push delivery](https://docs.expo.dev/push-notifications/sending-notifications/), [Codex guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude memory](https://code.claude.com/docs/en/memory), [Copilot instructions](https://docs.github.com/en/copilot/reference/custom-instructions-support), [OpenCode rules](https://opencode.ai/docs/rules/), [EAS tests](https://docs.expo.dev/eas/workflows/examples/e2e-tests/), [Maestro screenshots](https://docs.maestro.dev/reference/commands-available/assertscreenshot).
