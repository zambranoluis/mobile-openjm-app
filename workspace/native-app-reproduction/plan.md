# OpenJM mobile app: complete native reproduction and verification plan

Adopted from the user's replacement plan on 2026-10-08. This is the active execution owner. Earlier plans are historical, not operative dependencies. Progress and exact next action live in [resume.md](resume.md) and [stage register](records/stage-register.md); the approved requirements below remain intact.

## 1. Objective, scope and starting point

Complete the Android and iPhone application as a native reproduction of `web-openjm-frontend`, using the web app's mobile layouts, branding, artwork, control hierarchy and recognizable animations as the visual reference.

Implement the experience with native components, navigation, storage and device behavior. Preserve shared authoritative product data and continue existing work rather than rebuilding functioning infrastructure.

This plan is self-contained and supersedes the previous execution plans. It retains all necessary architectural decisions, scope boundaries and acceptance requirements. Deleting the previous plans must not remove requirements needed to execute this one.

Replacement work record: `workspace/native-app-reproduction/plan.md`, with its own investigation, resume record and supporting records. Existing test evidence and artifacts remain preserved in their current locations; they are historical evidence, not dependencies on deleted plans.

### Starting evidence

- Native feature source already covers authentication, conversations, groups, jobs, embeddings, files/media, account/security, billing, usage, configuration, integrations, anonymous access and legal documents.
- The web operation inventory currently contains 130 operations. The mobile gateway specification contains 104 paths and matches the app snapshot.
- The latest observed mobile check passed documentation/contracts/assets/legal/math/locales, lint, typecheck, 25 component tests and 63 unit tests.
- All 244 frozen R8 inputs matched during the preceding review. Retained Android emulator captures confirm selected fictional journeys.
- Gateway, Spring, PostgreSQL and real Redis checks have retained passing evidence. Those results do not establish live web/mobile integration.
- Visual and workflow parity remain incomplete. No installed iOS acceptance, physical-device acceptance, staging integration or signed private distribution has passed.
- Shared replay cutover and notification dispatch remain disabled.

These are starting observations. Recheck changed or drift-prone facts before using them as acceptance evidence.

### Retained boundaries

Initial targets are portrait Android phones and iPhones, with local/private testing followed by staging and private distribution. Public stores, store billing and tablet-specific layouts remain deferred.

Coordinated implementation covers the mobile repository, the backend's mobile gateway/Spring integration, and necessary web transport compatibility/build fixes. The existing website's visual design is a reference; redesigning it is outside scope.

Do not edit upstream API documentation, stage/commit/push, deploy, publish builds, change agent settings or alter unrelated services without explicit direction.

## 2. Architecture and interface requirements

### Ownership and runtime

Retain Expo SDK 57, React Native, strict TypeScript, Expo Router, npm and committed lockfiles. Keep routes thin, product behavior in features, reusable presentation in native UI, and device operations behind platform adapters.

The application communicates with the independent TypeScript/Fastify mobile gateway. The existing web gateway remains separate. Both use protected Spring services, PostgreSQL, Redis and upstream OpenJM services.

- OpenJM owns model availability, quotas, credits, plans and upstream decisions.
- Spring owns authentication, authorization, sessions, persistence, shared replay, jobs and notification tracking/delivery.
- The gateway owns versioned native transport adaptation and validation.
- The app owns presentation, account-isolated drafts and device lifecycle.

The mobile app must build without sibling source imports and operate independently of website availability.

### Authentication, transport and continuity

- Keep bearer access credentials in memory and refresh credentials in SecureStore. Preserve stable installation binding, serialized refresh, atomic rotation, server expiry, MFA, sensitive-action authorization and revocation.
- Preserve browser authentication/session behavior. Native authentication must not issue usable credentials before required verification and profile decisions.
- Retain explicit gateway mappings, validated payloads, bounded JSON/uploads/downloads, machine-readable errors and redacted logs. Only the public gateway origin belongs in app configuration.
- Preserve SSE framing, split UTF-8/lines, terminal-event detection, cancellation and bounded buffering. Conversation replay cursors and upstream job cursors remain distinct.
- Reopen reconciles server state and attaches to existing work. It never automatically resubmits a message.
- Use one stable submission identity for each logical request and its supported recovery. Do not automatically retry non-idempotent operations.
- Hosted checkout opens in the system browser. Refresh authoritative billing state on return; a return URL is not payment confirmation.
- Completion/failure alerts remain opt-in, account-bound and resource-specific, using persistent deduplication, leases, provider tickets/receipts and invalid/logout cleanup.

### Required interface additions

Expand the native conversation models and rendering to preserve authoritative response details, references, attachment/context metadata, generated results and relevant work state currently represented by the web client. Handle structured thinking/answer streaming using the actual producer contract.

Extend native usage models to represent summaries, chart/history queries, request/conversation details and report data. Preserve missing, partial and stale states instead of inventing zero values.

Add native adapters for clipboard actions, date selection, camera/photo capture and QR scanning/image decoding. Camera access follows an explicit user action. QR results require review and intentional redemption. Expo's camera API supports preview barcode scanning and QR decoding from images. Reference: https://docs.expo.dev/versions/v57.0.0/sdk/camera/

Add or amend gateway mappings only when a traced native requirement needs an existing authoritative contract. Update the gateway-owned specification and mobile snapshot together. Do not invent server endpoints or reproduce server-owned policy in the app.

## 3. Visual and motion specification

### Mobile-web composition with native behavior

Use inspected current mobile web surfaces as the visual reference. Record deliberate native adaptations rather than treating existing web defects as requirements.

- Replace the visible Conversations/Apps/Account tab shell with the web-style branded mobile header and drawer, backed by native navigation stacks.
- Preserve the web's principal destinations and profile/configuration hierarchy. Retain existing groups, jobs, embeddings and completion alerts through appropriate secondary destinations.
- Default authenticated entry to history unless an authorized deep link or account-scoped restored conversation takes precedence.
- Preserve native Back, iOS back gestures, safe areas, keyboard adjustment, focus restoration and screen-reader behavior.
- Reuse approved OpenJM logos, icons, mobile artwork and Roboto assets. Support native font scaling; OS-owned dialogs and pickers retain their system presentation.
- Preserve the dark/green identity, compact hierarchy and contextual actions. Enlarge touch areas to at least 48 dp on Android and 44 pt on iOS.
- Keep working content readable at small sizes and large text. Native adaptations may grow/reflow controls instead of reproducing clipping or fixed-height web layouts.

### Motion implementation

Use the existing Reanimated runtime and Expo-compatible React Native Skia for native graphics. Expo SDK 57 recommends Skia 2.6.2; pin the compatible installation and verify native builds. Reference: https://docs.expo.dev/versions/v57.0.0/sdk/skia/

- Hummingbird: generate optimized transparent frame assets from the approved model through reproducible offline rendering. Animate flight, hovering and landing with native transforms and frame playback. Retain recognizable appearance and choreography without interactive runtime 3D.
- Launch behavior: show the static brand immediately. Start the bird only while workspace preparation is pending and assets are ready. When data becomes ready, finish the current entrance and exit cleanly into the header branding. Do not impose the web's fixed five-second hold or replay the cinematic loader for ordinary navigation.
- Login background: reproduce drifting beams, stars and grain with native graphics. Arrange light around a quiet form area; keep the background independent of scrolling and keyboard resizing.
- Chat orb: reproduce recognizable standby, working, menu and applicable creation/playback forms using native graphics and bounded particle density. Drive changes from actual UI/request/playback state.
- Music bloom: animate during playback without microphone permission. This is a playback animation, not claimed beat or spectrum analysis.
- Other loading: adapt skeletons, processing indicators, attachment/media readiness and screen transitions to their actual states. Decorative motion never invents progress or delays a request.
- Pause decorative loops when hidden/backgrounded and release resources on unmount. Reduced motion and renderer/asset failure use static equivalents. Failed artwork must not block authentication or navigation.

Target 30 fps for ambient effects, while preserving responsive native scrolling and gestures. Profile effects enabled/disabled on representative devices, and reduce decorative complexity where necessary.

## 4. Verifiable execution stages

Each stage produces source changes, applicable tests, inspected evidence and an updated resume checkpoint. Existing source may satisfy part of a stage; it does not automatically satisfy revised visual or acceptance requirements.

### Stage 1 — Adopt the replacement and establish coverage

- Save this complete plan and create new investigation/resume records. Update active documentation links to the replacement; remove operative dependencies on previous plans.
- Import a concise baseline from existing evidence records, including source/build identities, passing and failed checks, preserved artifacts and exact limitations.
- Extend the operation inventory into a parity matrix covering routes, workflows, screen states, visuals and motion. Include browser-only/deprecated operations and restricted capabilities with explicit dispositions.
- Update product/design documentation for selected navigation, visual reproduction and motion direction. Preserve the independent four-provider instruction system and its separate loading evidence.
- Record staging, QA, signing, device and provider-access dependencies. Inspect Git state and listener ownership before runtime work.

Acceptance: every current web surface and operation has a native mapping or justified disposition; every remaining requirement has a stage, evidence requirement and next action. The replacement remains usable after previous plan files are deleted.

### Stage 2 — Establish visual references, native controls and shell

- Capture equivalent fictional mobile web states at small, standard and larger phone widths using the web repository's controlled capture rules. Freeze relevant source revisions, assets and reference captures.
- Implement native brand typography/icons/artwork, compact fields, contextual actions, sheets/dialogs, date controls, feedback and loading primitives.
- Build branded header/drawer and native stacks. Preserve existing account-bound notification/result routes and intentional navigation restoration.
- Use virtualized lists for accumulating histories/activity rather than rendering every loaded record in one scroll container.

Acceptance: installed shell captures match reference hierarchy/composition with documented OS adaptations. Drawer dismissal, Back, safe areas, focus/restoration pass. Supporting destinations remain accessible without duplicated global navigation.

### Stage 3 — Complete authentication and account entry

- Reproduce mobile login, registration, recovery/reset, account-created/status and profile-completion presentation.
- Preserve MFA/TOTP, resend cooldown, invalid/expired challenges, password controls, input retention and authoritative completion decisions.
- Integrate login background behind recoverable, keyboard-aware forms.
- Keep guest navigation and legal/language entry coherent with the web experience.

Acceptance: positive/failure journeys pass on installed builds; focused fields remain visible with keyboard at normal/large text. Session restoration, expiry, logout and failed credential removal remain secure.

### Stage 4 — Complete branded motion

- Implement hummingbird asset pipeline/loading sequence, login field, chat orb and contextual loading/transition effects.
- Bundle approved assets locally with provenance, checksums and deterministic preview checkpoints.
- Separate decorative clocks from request/job state. Cover interruption, readiness during entrance, re-entry, background/foreground and reduced-motion changes.

Acceptance: inspect stills and continuous playback. Bird remains clear/contained; form/message readability preserved; hidden screens have no active decorative loop. Static fallbacks work, effects meet recorded device performance checks.

### Stage 5 — Complete history and conversation workflows

- Reproduce compact search/filter controls, date-grouped rows, row menus, New chat action, pagination and distinct loading/empty/error states.
- Add history date filtering and retain groups through secondary controls.
- Dock expanding composer above keyboard independently from message list. Move secondary settings into contextual menus/sheets.
- Make one intentional action create/send a new conversation, including first-message attachments. Persist created identity/submission state before sending and reconcile uncertain outcomes without blind retries.
- Complete model/mode controls, reasoning/web-search options, context/file selection, Markdown/code/math, copy actions, Thinking/Quotes/Sources, generated-result cards and conditional auto-follow.
- Preserve drafts, older-message pagination, shared-stream recovery, job creation/following/cancellation and embeddings.

Acceptance: new/saved conversation journeys pass with attachments, long content and interruptions. Reading position stable away from newest message. Details reflect supplied data; restart/recovery does not duplicate execution.

### Stage 6 — Complete files, media and guest conversation

- Reproduce public conversation entry/welcome/multi-turn presentation, composer menus, attachment previews, response details and New chat cleanup.
- Integrate private/public image/music options/results into chat. Retain conditional owned video viewing/playback while preserving disabled generation and voice restrictions.
- Complete file selection, camera capture, upload readiness, previews, context association, download/native sharing.
- Preserve anonymous resource credentials/expiry/cleanup independently of account credentials.
- Investigate retained large-transfer failures; verify interrupted downloads, discarded partial data and intentional retry.

Acceptance: installed image/music/file/guest journeys pass including expiry, cleanup, cancellation, cold reopen/playback pause. Verify recipient receipt separately from share sheet opening. Bounded fixture transfers do not close production compatibility.

### Stage 7 — Complete account, billing and usage parity

- Reproduce profile navigation, personal/security forms, profile photo, OTP/two-factor flows and consequential confirmations.
- Reproduce separate credits/billing experiences: activity, manual/QR gift redemption, top-up, plan comparison/purchase/subscription and authoritative checkout return.
- Complete usage summaries, model/metric chart selection, date-range history, Requests/Conversations views, event details, plan/limit information and filters/pagination.
- Provide usage JSON reports/CSV exports separately from sensitive account export.
- Preserve authoritative units, costs, balances and partial/stale/missing states.

Acceptance: positive/failed/cancelled operations pass. QR decoding cannot itself redeem. Export contents match represented data/scope. Billing completion established through authoritative account state.

### Stage 8 — Complete apps, configuration, legal and languages

- Reproduce catalog/installations navigation, search/status filters, artwork/details and compact configuration workflows.
- Complete installation lifecycle, enable/configuration updates, secret handoff/rotation/removal and Obsidian status/import/export with truthful partial outcomes.
- Reproduce configuration hierarchy for memories/preferences/tools, domains/API keys. Preserve sensitive authorization, import/export and actual connection/verification distinctions.
- Provide all nine legal documents offline with readable contents/navigation/supported links.
- Complete English, Spanish, Portuguese, Hindi, Chinese and Russian native UI translation review. Preserve user/server content and approved legal text in supplied language.

Acceptance: every applicable matrix operation has native behavior/operation-specific evidence. No secret in ordinary logs/captures. Whole-interface review covers dynamic labels, errors and large-text layouts.

### Stage 9 — Complete shared backend and live integration

- Revalidate gateway mappings/DTOs, native sessions, migrations, replay/notification contracts after frontend changes.
- Resolve recorded web production-build blocker if still present within coordinated scope; run affected regressions.
- Verify live authentication/MFA/profile lifecycle, attachments, jobs, billing, integrations and ownership with designated QA access.
- Demonstrate one live response shared by web/mobile including duplicate/conflicting sends, disconnect/resume, replay expiry and backend/Redis interruption.
- Preserve legacy replay readers/records. Observe producer drain/retention before authorized shared-replay cutover.
- Verify actual push provider handoff, receipts and authenticated resource links.

Acceptance: real-service evidence establishes compatibility/shared continuity. Real Redis/PostgreSQL cover concurrency/persistence. Cutover/dispatch remain off until acceptance and deployment authorization satisfied.

### Stage 10 — Complete Android/iOS and physical-device acceptance

- Run complete applicable installed-app matrix on both platforms.
- Cover small phones, large text, all languages, screen readers, reduced motion, keyboard/safe areas, native gestures/denied permissions.
- Exercise network changes, background/reopen, cold restart, refresh races, logout, interrupted uploads/downloads/job recovery.
- Verify physical camera/QR, sharing, media/audio, notification delivery/deep links/animation performance.
- Rerun corrected split journeys as complete flows where full-flow evidence missing.

Acceptance: platform-specific evidence closes every required lane. Unavailable runtime/device remains pending; Android success cannot close iOS.

### Stage 11 — Produce verified private builds

- Use approved staging HTTPS, QA access, Expo/EAS configuration, Android signing/Apple provisioning.
- Produce installable signed ARM Android APK and signed private iOS artifact for registered testers.
- Supply installation/configuration instructions, known limits, hashes, source/contract identities/reproducible build records.
- Prepare gateway/replay/notification rollout/rollback instructions, additive migration compatibility and active-reader retention.
- Obtain separate direction before hosting, publication or distribution requiring it.

Acceptance: both signed artifacts install/pass staging smoke/lifecycle on tester devices. Debug emulator APKs/JavaScript exports cannot satisfy private release.

## 5. Tracking, verification and resumption

### Progress records

Maintain stage register/parity matrix here. Each requirement records stable ID, source evidence/native destination, implementation/visual statuses, separate Android/iOS/live/physical results, evidence/build identity, unresolved defect/prerequisite and exact next action.

Use `not started`, `in progress`, `verified`, `blocked` and explicitly approved `deferred`. Stage verified only when all applicable acceptance passes. A blocked lane does not prevent independent work and must never be silently deferred.

Keep current state/next action updated. At meaningful boundaries/every handoff, update resume with changed files, commands/results, evidence locations, runtime ownership, failures, prerequisites/next executable task.

### Verification gates

- Mobile source: `npm run check`, diff review, `git diff --check`.
- Dependency/config changes: reproducible `npm ci`, Expo compatibility/Doctor, exports/native builds exercising change.
- Gateway: tests/typecheck/build/specification compatibility; regenerate specs only with reviewed contract changes.
- Spring: owning controller/service tests, full required suite, migration/persistence, real Redis/PostgreSQL.
- Affected web: lint/types/quality/build/focused unit/Playwright via wrappers.
- Visuals: equivalent fictional references, inspected native captures/reviewed baselines; documented OS differences.
- Motion: continuous playback/lifecycle/profiling, not only screenshots.
- Device/live: installed journeys/actual outcomes separate from fixtures/source tests.

Generated evidence in ignored test-artifact directories. Record platform/OS/device, locale/font scale, build/source identity, commands/outcomes. Never retain credentials/private content/sensitive captures in tracked records.

Create versioned artifacts/input freezes after changes. Preserve previous outputs/failed runs. Fresh compatible dependency audit required; no forced incompatible upgrades or lower gates.

### Known dependencies and unfinished evidence

- Job cancellation/cold reopen and embeddings JSON/base64/dimensions acceptance.
- Applied usage-filter/pagination semantics and complete corrected journeys.
- Installed controlled binary interruption/retry and earlier unresolved large-write behavior.
- Complete translations, screen-reader, reduced-motion, network/lifecycle coverage.
- Live QA, staging HTTPS, push configuration, physical phones, EAS access, Apple signing/macOS.
- Actual shared-response cutover/drain/retention and signed private distribution.
- Claude/OpenCode instruction loading where authenticated provider access unavailable.

Retained emulator service predates new interruption control. Verify actual version before flows, preserve previously rejected restart boundary, do not bypass denied operations.

### Resume procedure and completion definition

1. Read replacement plan/investigation/stage register/resume.
2. Inspect Git state, relevant source/build identities, prerequisites/listener ownership.
3. Select recorded next unblocked task; preserve valid evidence unless changes/concerns invalidate it.
4. Execute scoped work/applicable acceptance, inspect results/update records before stopping.

First task: Stage 1 adoption/baseline/expanded parity matrix. Then native shell/references.

Complete only when frontend experience including visual/motion adaptations is implemented, applicable matrix lanes verified on both platforms/live services, and signed private builds pass installation acceptance. Handoffs report changes, checks, evidence limits, exact remaining work/proposed commit title.

## User-requested stop checkpoint

Execution stopped at the user's request on 2026-10-08. Stage 2 source work and partial later-stage work are recorded in [stop checkpoint](records/stop-checkpoint.md) and [resume](resume.md). Latest mobile gate fails at lint; no changed native build is accepted. Resume only after new user direction. Approved requirements above remain intact.
