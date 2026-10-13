# Native reproduction investigation

## Request

Implement the user's eleven-stage replacement plan. Mobile, traced gateway/Spring changes and web transport/build fixes are authorized; publication, deployment, settings changes and upstream documentation edits are not. The reference is the current mobile website, implemented with native controls and device behavior.

## Grounding

Read local AGENTS, WORK, CODE, NATIVE, INSTRUCTIONS, PRODUCT, DESIGN, README and tests/README. Read the prior resume, selected R7/R8 results, release prerequisites and provider loading evidence. Read web capture rules and dashboard shell/Navbar/Aside/history sources. Personal memory supplied architecture history only; current source and checks govern implementation.

## Findings and limits

- Mobile Git HEAD `8d14fbdcd09aafe219dd7a3862e39a4300ff1cdb`, initially clean. Web HEAD `d6b09d77649b35f719b17c68d1a8909ecca6cc04`, initially clean. Backend HEAD `6747edd36b4dc2fab8ed4c501e70f66726110209` has extensive pre-existing modified/untracked native integration source. Preserve it.
- Before edits, `node scripts/artifact-inputs.mjs verify workspace/native-app/records/fixture-r8-inputs.json` matched all 244 inputs. Historical matching does not approve changed source for R8.
- Coordinated `npm run contract:check -- ../web-openjm-backend-api/mobile-gateway/spec/openapi-v1.json` passed 104 paths, SHA256 `d1963c834b52ea1e45dc68b7ee8c375078951012d5fea908bb53c3c549c79ec0`.
- The visible native shell uses Tabs. History accumulates every row in a scrolling form. Web mobile Navbar uses a profile control, centered wordmark and menu; Aside owns history/new chat/apps/configuration/profile/legal. These are concrete Stage 2 gaps.
- Roboto TTFs and mobile artwork exist in the web checkout. Existing mobile assets retain the approved hummingbird and nine offline legal documents.
- No compatible web listener at 3000 was present during initial inventory. Spring Java listener 8082 is user-managed; Android emulator and fixture listener already exist. Do not start another frontend port contrary to its runtime owner.
- Fictional loopback Node PID 20404 owns 8097, command `node tests/fixtures/server.mjs`. Its retained version lacks interruption control; preserve the prior rejected restart. Emulator PID 20508 / emulator-5554 is retained. Do not reset the server or treat source updates as running updates.

## Corrections

Earlier six-stage plans are superseded. Historical evidence remains preserved. Active tools and documentation will use this work item; copied baseline records carry source hashes. No previous plan is needed to resume.

## Open questions and owners

User confirmed local Android emulator only in this execution. iOS/macOS/EAS/signing/physical testers are unavailable. Staging HTTPS, secure QA and push provider configuration remain unsupplied. These block dependent acceptance, not independent local work. Claude/OpenCode loading remains unverified with unavailable authenticated providers. See prerequisites and stage register.

## Stop and corrected current findings

The user requested "record progress and stop." New direction is required to resume. Initial Tabs/scrolling-history findings above describe starting source; Stack/header/drawer/SectionList source now exists without installed acceptance. Web CSS blocker is fixed and web source/build gates passed; QA preflight now fails 401 expired/revoked session. Latest mobile gate fails at the Windows ResponseDetails/responseDetails collision and unused RichText import; later gate stages were not reached. No changed native build/install occurred. See [stop checkpoint](records/stop-checkpoint.md) for exact changes/checks/limits/services/remaining work.
