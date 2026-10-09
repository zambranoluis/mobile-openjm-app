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

Resumed at the user's request on 2026-10-08. The retained utility failure screenshot and hierarchy show only the clipped Embedding text label at [48,1213][672,1232]; the matching input is outside the scroll viewport. The scroll command matched the label, then the indexed input tap failed. Correct the flow to scroll to the indexed input and center it; no application layout change is justified by this evidence. The retained completed-job capture shows completed status and the fictional result.

At resumption: Small_Phone emulator-5554, Android 16, font scale 1.0. Installed base APK SHA256 matches preserved R6 (96a622c42092d6e7d57485c8b5f293bdb63144133d38c313e2a2cca30454be24); all 244 frozen source inputs verify unchanged. Logs, Maestro and APKs are under workspace/native-app/local/ and workspace/native-app/output/, rather than the root-local paths in the handoff. Existing fictional server PID 29952 matches its retained PID and listens on 127.0.0.1:8097. Reuse it and preserve unrelated .codex/ content.

The corrected indexed selector passed, but the installed R6 run then failed asserting entered text with the keyboard open. Its inspected capture shows the dimensions field above the keyboard while the focused embedding input is below the visible viewport. Shared KeyboardScroll remeasures on keyboard/content changes but not viewport layout, and leaves Android's clipping default enabled. Add layout-triggered reveal and keep form children measurable; verify the correction in a separately preserved R7 bundle before claiming keyboard acceptance. R6 source gate passed again (23 component checks, 61 Node checks).

R7 installed utilities subsequently passed with inspected keyboard/result/chooser captures. Photo removal, invalid/valid deletion OTP and signed-out restart passed. Public image passed; 300-second chunked public-music content failed twice with a native framing error while host HTTP received all bytes. Diagnose using explicit known-length fixture framing, preserving the failing chunked lane. The app currently surfaces that raw native error, which can include response bytes: normalize binary read failures into recoverable download feedback, discard partial bytes and preserve typed size/session/cancellation failures. This feedback correction does not solve or close the underlying chunked-transfer issue.

The plan's Plan Mode restriction was stale: implementation is authorized in Default mode. Android tooling was found outside PATH, a bundled emulator APK built and its installed guest journey passed. Real Redis and HTTP replay checks passed. No live QA authentication, physical/iOS device, staging or signed private distribution has passed. Latest results and exact pending gates live in plan.md.

R8 build/signature/install and final source gate passed25 component/63 Node checks; all244 frozen inputs and11 distinct APKs verify unchanged. Installed package hash matches R8. Streamed300-second public/owned media and same-task early pause at46/300 passed; original large-write failures remain unresolved. Profile picker/upload/refresh, anonymous PNG attachment/chat/share/cold restoration/expiry/stronger cleanup, affected account/files/math/language and200% utility checks passed with recorded split-flow distinctions and inspected captures. Font1.0/English restored. Automatic approval review rejected verified task-owned fixture restart with reason blocked by policy; the running service was preserved. New controlled binary interruption/retry passed isolated HTTP checks but installed execution remains pending. No publication/settings change or rejected-action workaround occurred. Current paths/results/limits are in records/r7-native-validation.md and resume.md.

## Open questions

Staging HTTPS and QA accounts, Expo/EAS access, Apple signing and tester devices are release prerequisites owned by the user. Requested through secure configuration; independent local implementation continues. Android tooling and Redis/persistence runtime availability need setup checks before their dependent acceptance.
