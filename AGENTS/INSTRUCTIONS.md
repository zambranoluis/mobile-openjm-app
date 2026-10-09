# Instruction maintenance

Change instruction files only when instruction work is explicitly in scope. Identify the intended behavior, recurring failure, trigger and justified scope before adding a rule. Prefer correcting its existing owner over duplicating it. Test a relevant task, an out-of-scope task and a task needing no change. Keep standing criteria, exceptions and boundaries entirely in this repository's canonical chain; work records and external references can explain provenance but cannot replace operative rules.

`AGENTS.md` is canonical for Codex and OpenCode. Routed files are read selectively by the agent; links do not claim automatic inclusion. `CLAUDE.md` imports the root entry. `.github/copilot-instructions.md` is generated from the root plus routed owners because Copilot support differs by host. `npm run instructions:generate` regenerates it with relative links rebased; `npm run docs:check` checks drift and local links.

Document completeness, provider format and observed loading are separate checks. For loading, launch each supported host from this repository and ask it to identify the entry, ownership boundary and verification commands without providing them in the prompt. Record host/version and observed answer; do not alter user host settings to force a pass. An unavailable or unauthenticated host is an unverified loading check.
