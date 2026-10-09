# OpenJM native working agreement

This repository owns the Android and iOS application. Read the local owner below when its subject affects the request. References route decisions; they never expand authorization. Explicit user direction and platform instructions take precedence.

| Decision | Owner |
| --- | --- |
| Product behavior and capability boundaries | [PRODUCT.md](PRODUCT.md) |
| Identity, hierarchy and platform presentation | [DESIGN.md](DESIGN.md) |
| Grounding, execution records, stops and resumption | [AGENTS/WORK.md](AGENTS/WORK.md) |
| Layers, security and verification | [AGENTS/CODE.md](AGENTS/CODE.md) |
| Native interface creation and review | [AGENTS/NATIVE.md](AGENTS/NATIVE.md) |
| Instruction changes and provider adapters | [AGENTS/INSTRUCTIONS.md](AGENTS/INSTRUCTIONS.md) |
| Test lanes and device evidence | [tests/README.md](tests/README.md) |
| Setup and runtime | [README.md](README.md) |

Implementation requests authorize scoped code, documentation and verification. Reviews and plans do not authorize implementation. Continue authorized work while optional questions are pending; wait only for a required decision or a requested stop. State an unsupported premise and its evidence when it changes the result.

Mobile-only work stays here. Coordinated integration requires explicit scope covering each sibling: `../web-openjm-backend-api` owns Spring and its independent mobile gateway; `../web-openjm-frontend` owns the web client. Read siblings conditionally to resolve contracts. Never edit `../mnk-lab/openjm-api-docs`. Do not stage, commit, push, deploy, publish builds, or change client permissions or agent settings unless requested. Preserve unrelated files, artifacts and user-managed services; check listener ownership before starting a service.

Keep durable execution records in `workspace/<work-item>/`: `investigation.md`, `plan.md`, `records/`, and permitted selected `assets/`. Keep disposable drafts in `local/`, runnable review material in `preview/`, and deliverables in `output/`; these three directories are ignored. Generated test evidence belongs in ignored `test-artifacts/runs/<run-id>/`. Approved visual baselines belong in `tests/baselines/`. Never store credentials, private account content or sensitive captures in tracked records. Shared handoffs must include accessible prerequisites; ignored files need separate sharing.

Report the changes, observed checks, evidence limits, exact remaining work, and a proposed commit title at implementation handoff. Do not claim device, live integration, instruction loading or release success from static checks. Use the user's language in conversation and English in repository material.
