<!-- Generated from canonical local guidance. Run npm run instructions:generate; do not edit. -->

<!-- Source: AGENTS.md -->
# OpenJM native working agreement

This repository owns the Android and iOS application. Read the local owner below when its subject affects the request. References route decisions; they never expand authorization. Explicit user direction and platform instructions take precedence.

| Decision | Owner |
| --- | --- |
| Product behavior and capability boundaries | [PRODUCT.md](../PRODUCT.md) |
| Identity, hierarchy and platform presentation | [DESIGN.md](../DESIGN.md) |
| Grounding, execution records, stops and resumption | [AGENTS/WORK.md](../AGENTS/WORK.md) |
| Layers, security and verification | [AGENTS/CODE.md](../AGENTS/CODE.md) |
| Native interface creation and review | [AGENTS/NATIVE.md](../AGENTS/NATIVE.md) |
| Instruction changes and provider adapters | [AGENTS/INSTRUCTIONS.md](../AGENTS/INSTRUCTIONS.md) |
| Test lanes and device evidence | [tests/README.md](../tests/README.md) |
| Setup and runtime | [README.md](../README.md) |

Implementation requests authorize scoped code, documentation and verification. Reviews and plans do not authorize implementation. Continue authorized work while optional questions are pending; wait only for a required decision or a requested stop. State an unsupported premise and its evidence when it changes the result.

Mobile-only work stays here. Coordinated integration requires explicit scope covering each sibling: `../web-openjm-backend-api` owns Spring and its independent mobile gateway; `../web-openjm-frontend` owns the web client. Read siblings conditionally to resolve contracts. Never edit `../mnk-lab/openjm-api-docs`. Do not stage, commit, push, deploy, publish builds, or change client permissions or agent settings unless requested. Preserve unrelated files, artifacts and user-managed services; check listener ownership before starting a service.

Keep durable execution records in `workspace/<work-item>/`: `investigation.md`, `plan.md`, `records/`, and permitted selected `assets/`. Keep disposable drafts in `local/`, runnable review material in `preview/`, and deliverables in `output/`; these three directories are ignored. Generated test evidence belongs in ignored `test-artifacts/runs/<run-id>/`. Approved visual baselines belong in `tests/baselines/`. Never store credentials, private account content or sensitive captures in tracked records. Shared handoffs must include accessible prerequisites; ignored files need separate sharing.

Report the changes, observed checks, evidence limits, exact remaining work, and a proposed commit title at implementation handoff. Do not claim device, live integration, instruction loading or release success from static checks. Use the user's language in conversation and English in repository material.


<!-- Source: AGENTS/WORK.md -->
# Grounding and execution

Identify the request as answer, investigation, review, plan or implementation. Trace the behavior's owner, input/output contract, consumers, requirements and applicable check before changing it. Source, observed runtime and official documentation are evidence; a filename, dependency, mock or prior conclusion does not prove integration. Investigate only material gaps. Ask about unresolved intent when the answer changes the outcome; continue independent work while waiting.

For bounded work, ground and verify directly. For independent mechanisms, substantial risk or likely resumption, save `workspace/<work-item>/investigation.md` and `plan.md` before dependent execution. A supplied approved plan is authorization to implement its scope; do not ask for the same approval again. Saving a plan alone is not authorization. A material departure from the approved approach needs a concrete explanation and decision before dependent work.

An investigation records Request, Grounding, Findings with evidence and limits, Corrections, and Open questions with their owner and dependent work. A plan records Objective, Current state and next action, Stages, Progress, Validation criteria, Validation results, Decisions, prerequisites and Remaining work. Record failed checks and corrections. Mark a stage complete only when its applicable acceptance passes. Keep records current at meaningful boundaries and before handoff. On resumption, read the record, inspect current Git state and verify drift-prone prerequisites.

Standing requirements belong in their local canonical owners, never only in workspace records, personal skills, memory or prior conversations. Update owners made inaccurate by implementation. If a required runtime or credential is unavailable, record the precise remaining check, continue independent authorized work and report the limitation. A requested immediate stop takes effect immediately; a stop after a stage takes effect after recording that stage's result. No record authorizes edits outside the request.


<!-- Source: AGENTS/CODE.md -->
# Code and verification

## Ownership

`app/` contains thin Expo Router entries. `src/features/` owns product behavior; `src/ui/` owns reusable native controls and tokens; `src/platform/` owns device storage, notifications, files and external browser adapters; `src/api/` owns the versioned transport client and contract snapshot. Features consume explicit APIs, not sibling source or browser DOM/CSS. OpenJM owns models, quota, credits, plans and upstream decisions. Spring owns authentication, authorization, persistence, shared replay and jobs. The mobile gateway owns versioned transport adaptation; the app owns presentation, drafts and device lifecycle.

Keep TypeScript strict. Validate untrusted payloads at the boundary, preserve status/code/state distinctions, authorize before side effects, and avoid automatic retries of non-idempotent operations. Refresh attempts are serialized. Access credentials stay in memory; refresh credentials use SecureStore. Isolate local drafts by authoritative account ID. Installation context is stable across upgrades and network changes. Never embed proxy secrets, upstream keys or credentials in public Expo configuration, builds, logs or recorded fixtures.

Streaming must handle split UTF-8, split lines, CRLF, event framing, resume IDs, cancellation and bounded buffers. Conversation replay and upstream job cursors have different meanings. Background/reopen reconciles server state and never automatically resubmits a message. Hosted checkout return triggers authoritative account refresh; a URL is not payment proof.

## Verification

Every change needs diff review and `git diff --check`. Documentation changes need `npm run docs:check`; regenerate provider adapters and check drift after canonical changes. Application changes need `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:unit`, `npm run contract:check`, and the relevant installed-app lane. Dependencies/configuration need `npx expo install --check`, `npx expo-doctor`, and an export or native build exercising the changed mechanism. Use `npm ci` to reproduce pinned installs.

Security and cross-repository changes also need the owning gateway and Spring tests and affected web checks. Concurrency/replay acceptance requires real Redis; fixture tests are not persistence proof. A migration needs migration and persistence coverage. Never lower a gate or label a blocked check passed. Native visual and lifecycle claims require emulator/device evidence on both platforms as [tests/README.md](../tests/README.md) defines.


<!-- Source: AGENTS/NATIVE.md -->
# Native creation

Read PRODUCT and DESIGN before new screens or meaningful interaction changes. Establish the user's action, screen hierarchy, loading/empty/error/offline states and platform behavior before code. Preserve approved identity and capability choices; an adaptation is not rebranding. Use meaningful alternatives only for unsettled decisions. A supplied direction needs no new aesthetic approval.

Use system navigation stacks, native tab bars, back gestures and controls. Respect safe areas, keyboard insets, font scaling, screen-reader roles, selected/disabled states and reduced motion. Target at least 48 dp on Android and 44 pt on iOS. Forms remain recoverable after failures. Keep state visible when interrupted; background processing is online and server-owned. Never show a capability enabled merely because an endpoint name exists.

Use screen previews or installed-app captures to judge composition. Browser exports may verify bundling, but do not establish native appearance, keyboard, permission or gesture behavior. Inspect installed-app captures for each supported phone OS, small layouts, long content and large text. Review platform lifecycle and the complete user journey after correction. Record unavailable evidence explicitly. Optional personal design skills contribute techniques; their absence does not prevent applying this local workflow.


<!-- Source: AGENTS/INSTRUCTIONS.md -->
# Instruction maintenance

Change instruction files only when instruction work is explicitly in scope. Identify the intended behavior, recurring failure, trigger and justified scope before adding a rule. Prefer correcting its existing owner over duplicating it. Test a relevant task, an out-of-scope task and a task needing no change. Keep standing criteria, exceptions and boundaries entirely in this repository's canonical chain; work records and external references can explain provenance but cannot replace operative rules.

`AGENTS.md` is canonical for Codex and OpenCode. Routed files are read selectively by the agent; links do not claim automatic inclusion. `CLAUDE.md` imports the root entry. `.github/copilot-instructions.md` is generated from the root plus routed owners because Copilot support differs by host. `npm run instructions:generate` regenerates it with relative links rebased; `npm run docs:check` checks drift and local links.

Document completeness, provider format and observed loading are separate checks. For loading, launch each supported host from this repository and ask it to identify the entry, ownership boundary and verification commands without providing them in the prompt. Record host/version and observed answer; do not alter user host settings to force a pass. An unavailable or unauthenticated host is an unverified loading check.
