---
name: medi-curator-launch
description: Use when planning, implementing, auditing, or deciding production launch readiness for the medi-curator Health-AI app. Covers PM orchestration, Firebase production architecture, legal/privacy/medical gates, subagent dispatch, release GO/HOLD/BLOCKED decisions, and P0 remediation.
---

# Medi-Curator Launch

Use this skill for medi-curator production launch work.

## Required Context
Read these files first, only as needed for the current task:

1. `AGENTS.md` - project rules, ontology, gates, known risks.
2. `.claude/policies/launch-program.yaml` - launch tracks, owners, P0 backlog.
3. `.claude/policies/gates.yaml` - blocking gate definitions.
4. `.claude/policies/automation-rules.yaml` - change-triggered subagent dispatch.
5. `docs/launch/production-program.md` - human-readable launch program.

## Core Decision Rule
Return one of:

- `GO`: all blocking gates pass, deployment is verified, rollback is ready.
- `HOLD`: release may be possible, but validation, approval, or deployment evidence is incomplete.
- `BLOCKED`: a critical legal, privacy, security, or medical-safety issue remains.

Default to `HOLD` unless evidence supports `GO`.

## Launch Workflow
1. Classify the user request:
   - `baseline`: current launch readiness.
   - `p0`: critical remediation planning or execution.
   - `gates`: quality/legal/security/privacy/medical gate validation.
   - `decision`: final release decision.
   - `implementation`: code changes needed for a P0/P1 item.
2. Invoke or follow the project PM flow:
   - `program-manager` owns scope, priority, and GO/HOLD/BLOCKED.
   - `workflow-manager` owns milestone order, dependencies, and stop conditions.
   - `orchestrator` dispatches affected subagents.
   - `release-manager` makes final release execution decision.
3. For legal launch work, use:
   - `legal-launch-lead`
   - `medical-practice-law-auditor`
   - `pharma-advertising-auditor`
   - `samd-regulatory-auditor`
   - `privacy-legal-auditor`
   - `crisis-safety-legal-auditor`
   - `terms-policy-counsel`
   - `jurisdiction-watch-auditor`
4. For implementation work, keep edits scoped and verify with the relevant gate.
5. Save audit outputs under `docs/reviews/` when producing launch reviews.

## Blocking Items
Treat these as launch blockers until verified resolved:

- Browser exposure of Gemini secrets.
- Browser-direct LLM calls for production.
- Sensitive health history stored on the server instead of the user's device.
- Missing or undeployed Firestore Security Rules.
- LLM output shown without runtime schema validation.
- OTC recommendation combined with pharmacy location in a way that can be interpreted as advertising or referral.
- Self-harm flow missing official crisis resources before normal health advice.
- Missing DSR access/export/erase path for logged-in users.

## Firebase Production Target
Preferred launch architecture:

```text
React/Vite
  -> Firebase Hosting
  -> Firebase Functions API
  -> Firebase Auth ID token verification
  -> Gemini server-side proxy
  -> Firestore with Security Rules
  -> server-only audit logs
```

Minimum production requirements:

- `GEMINI_API_KEY` exists only in server/Functions secret storage.
- User data endpoints verify Firebase ID token.
- Firestore Rules restrict user data to `request.auth.uid`.
- Search history is persisted only on the user's device.
- Consent is recorded before sensitive storage.
- DSR endpoints verify ID token and write audit logs.

## Output Format
For launch reviews:

```markdown
## Launch Status: GO | HOLD | BLOCKED

### Why
- 

### P0 Blockers
| ID | Owner | Status | Evidence |
|---|---|---|---|

### Gate Status
| Gate | Status | Evidence |
|---|---|---|

### Next Actions
1. 
```

For implementation:

```markdown
## Scope
- 

## Changes
- 

## Verification
- 

## Remaining Risk
- 
```

## Guardrails
- Do not mark `GO` based on intent or planned fixes.
- Do not hide `CONDITIONAL` legal or medical findings.
- Do not bypass legal/privacy gates for speed.
- Do not add unrelated features while remediating P0 issues.
- Use official, current sources for legal/regulatory facts that may change.
