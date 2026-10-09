# Investigation: native app

## Request

Implement the supplied six-stage plan across mobile, Spring/mobile gateway and affected web transport. No Git publication, deployment or public store submission.

## Grounding

Heavy coordinated implementation, authorized by the supplied plan. Main records belong here; backend records belong with the backend. The local mobile repository initially contained only `.gitattributes`; backend was clean; the web repository has an unrelated untracked video record to preserve.

## Findings

Observed 2026-10-08: Node 22.14.0, npm 11.7.0, Java and Codex/Claude/OpenCode executables available. adb, Maestro and EAS were absent from PATH. Expo SDK 57 npm versions are available; official documentation lists RN 0.86, React 19.2.3 and Node minimum 22.13.x: https://docs.expo.dev/versions/v57.0.0/.

Spring authentication/session controllers and services own MFA, persistent sessions, cookies, bearer validation and proxy protection. The additive native boundary preserves web context policies. Next.js retains its legacy broker/store for the off mode and retention window. Implemented opt-in Spring `ConversationReplayStore`/`ConversationReplayService` now own shared reservation, producer lifetime and replay; both gateways have consumers. Redis checks passed, while actual drain/cutover and live cross-client acceptance remain open. Source presence does not establish deployment.

Web `DESIGN.md` establishes the preserved dark/green identity. Surface index and API handlers inventory operations; controller/DTO/service evidence must qualify each operation. Voice endpoints are explicitly denied in Spring, so they cannot be advertised as available.

Provider documentation inspected 2026-10-08: Codex discovers AGENTS at run startup (https://learn.chatgpt.com/docs/agent-configuration/agents-md); Claude imports with @path (https://code.claude.com/docs/en/memory); Copilot supports repository instructions with host-dependent support (https://docs.github.com/en/copilot/reference/custom-instructions-support); OpenCode uses AGENTS and does not automatically expand its links (https://opencode.ai/docs/rules/). Static adapter checks do not prove loading.

## Corrections

The plan's Plan Mode restriction was stale: implementation is authorized in Default mode. Android tooling was found outside PATH, a bundled emulator APK built and its installed guest journey passed. Real Redis and HTTP replay checks passed. No live QA authentication, physical/iOS device, staging or signed private distribution has passed. Latest results and exact pending gates live in plan.md.

## Open questions

Staging HTTPS and QA accounts, Expo/EAS access, Apple signing and tester devices are release prerequisites owned by the user. Requested through secure configuration; independent local implementation continues. Android tooling and Redis/persistence runtime availability need setup checks before their dependent acceptance.
