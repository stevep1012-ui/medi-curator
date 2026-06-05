# LAUNCH-P0-PLAN-2026-06-04

## Workflow Status: READY

### Current Mode
`p0-remediation`

### Stop Condition
P0-002 implementation is complete locally. Remaining stop conditions are deployment, legal, and medical evidence.

## P0 Execution Order
| Step | P0 | Agent | Depends On | Output |
|---|---|---|---|---|
| 1 | P0-002 | privacy-officer + security-auditor | Complete | Local-only search history implementation |
| 2 | P0-005 | security-auditor | Firebase project ID and deploy access | Deployment evidence for Hosting, Functions, Rules, secrets |
| 3 | P0-003 | legal-launch-lead | OTC product decision | Legal memo and UI/product constraint |
| 4 | MED gate | medical-reviewer + qa-engineer | P0-003 decision | Regression report |
| 5 | RELEASE | release-manager | Gates PASS | GO/HOLD/BLOCKED decision |

## P0-002 Decision
Chosen path: Option C, with local device storage retained.

Sensitive-health fields are no longer stored in Firestore:

- `symptoms`
- `currentMedications`
- `result`

### Option A: Client-side envelope encryption
Best aligns with `AGENTS.md`.

Requirements:
- Generate per-user data encryption key.
- Encrypt sensitive fields before Firestore write.
- Store only ciphertext, IV, version, and key metadata.
- Define recovery behavior if user loses key.

Risk:
- More product and UX work.
- Search history display requires decrypt path.

### Option B: Server-side encryption in Cloud Functions
Operationally simpler.

Requirements:
- Move symptom history write/read/delete behind Functions.
- Use server secret or KMS-backed key.
- Firestore client direct writes disabled for symptom history.

Risk:
- Does not satisfy strict "client-side envelope encryption" wording unless policy is updated.

### Option C: Disable server search-history persistence for launch
Fastest way to remove sensitive server-storage risk.

Requirements:
- Do not store `symptomHistory` on the server.
- Keep per-user history only in the current browser/device local storage.
- Update UI, consent, and privacy policy.

Risk:
- Loses logged-in history feature.

## Recommended Path
For fastest compliant launch:

1. Choose Option C for first production release.
2. Ship without sensitive server history persistence.
3. Add encrypted local storage or client-side envelope encryption as post-launch P1 if needed.

Reason:
- Removes PIPA §23 storage risk.
- Avoids weak encryption design.
- Reduces legal/privacy review scope.

## Next Command
Proceed with one of:

```text
Verify Option C: server symptomHistory disabled, local device history enabled
```

or

```text
Implement Option A: client-side envelope encryption
```
