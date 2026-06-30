# Product Quality Direction Report

## Date
- 2026-06-30

## Scope
- Request: ensure a program director and subagents exist so coding, design, workflow, usability, and UX quality all improve toward product completeness.
- Applied to: medi-curator `.claude/agents`, `.claude/commands`, and `.claude/policies` harness.
- Legal/medical/privacy gate decisions remain separate; product-quality agents must surface `LEGAL_HOLD` rather than override them.

## Agent Coverage

| Quality Axis | Agent | Status | Role |
|---|---|---|---|
| Program direction | `program-director` | ADDED | Directs product-quality axes, delegates subagents, consolidates backlog, reruns monitors. |
| Coding | `coding-quality-auditor` | ADDED | Audits type/runtime/API/security/testability risks that affect product completeness. |
| Design | `design-quality-auditor` | ADDED | Audits visual hierarchy, trust surface, tone, accessibility, localization readiness. |
| Workflow | `workflow-integrity-auditor` | EXISTING / WIRED | Audits menu tree, task paths, state transitions, dead ends. |
| Usability | `usability-auditor` | ADDED | Audits first-use clarity, mobile controls, error recovery, saved-state reuse. |
| UX/navigation | `ux-navigation-auditor` | EXISTING / WIRED | Audits navigation, hierarchy, mobile IA, accessibility. |
| Runtime | `runtime-reliability-auditor` | EXISTING / WIRED | Audits click paths, console/network errors, runtime reliability. |
| Non-legal red-team | `nonlegal-red-team-monitor` | EXISTING / WIRED | Audits safety/product-truth/photo retention while separating LEGAL_HOLD. |

## Policy/Command Changes

- Added `.claude/policies/product-quality.yaml` as the source of truth for product-quality axes, pass criteria, blocking conditions, and rerun loop.
- Added `.claude/commands/product-quality.md` to run the program-director quality loop.
- Updated `.claude/policies/monitoring.yaml` to include program-director, coding-quality, design-quality, and usability monitors.
- Updated `.claude/policies/launch-program.yaml` with `T7-PRODUCT-QUALITY` and `M5 Product quality hardening loop`.
- Updated `program-manager` so it can classify work into `T7-PRODUCT-QUALITY` and dispatch the new agents.

## Current Product-Quality Verdict

| Axis | Verdict | Evidence |
|---|---|---|
| Coding harness | PASS | Dedicated coding-quality auditor created and wired; verification commands defined. |
| Design harness | PASS | Dedicated design-quality auditor created and wired; trust-surface/accessibility checks defined. |
| Workflow harness | PASS | Existing workflow-integrity auditor remains wired into monitoring and program-director matrix. |
| Usability harness | PASS | Dedicated usability auditor created and wired; core task paths and smoke guidance defined. |
| UX harness | PASS | Existing UX-navigation auditor remains wired; product-quality policy references UX axis. |
| Runtime harness | PASS | Existing runtime-reliability auditor remains wired into monitoring and product-quality loop. |
| Non-legal red-team harness | PASS | Existing report command remains required in product-quality command. |

## LEGAL_HOLD

- Legal wording, advertising-law interpretation, pharmacy referral risk, PIPA legal interpretation, and SaMD classification remain outside product-quality auto-pass.
- Production release remains separately governed by `npm run gate:release-readiness` and legal/privacy/medical gates.

## Re-test Plan

1. Run `/product-quality` after any major feature/design/workflow change.
2. Run `npm run audit:redteam:nonlegal:report` for safety/product-truth drift.
3. Run build/security gates before commit/deploy:
   - `npm run lint`
   - `npm run build`
   - `npm run scan:secrets`
   - `npm run scan:bundle`
   - `npm --prefix functions run build` when Functions are touched

## Exit Criteria

- Program director returns PASS for all non-legal product-quality axes.
- No coding/design/workflow/usability/UX/runtime BLOCK remains.
- Non-legal red-team returns PASS.
- LEGAL_HOLD items are explicitly listed and routed to the legal/medical/privacy gate, not hidden.
