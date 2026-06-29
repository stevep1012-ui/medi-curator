# Monitoring Report Template

## Date
- YYYY-MM-DD

## Scope
- Commercial readiness / workflow / UX / runtime / red-team

## Findings
| Area | Verdict | Evidence | Impact | Owner |
|---|---|---|---|---|
| Commercial | PASS/WATCH/BLOCK |  |  |  |
| Workflow | PASS/WATCH/BLOCK |  |  |  |
| UX | PASS/WATCH/BLOCK |  |  |  |
| Runtime | PASS/WATCH/BLOCK |  |  |  |
| Red-Team | PASS/WATCH/BLOCK |  |  |  |
| Non-Legal Red-Team | PASS/WATCH/BLOCK/LEGAL_HOLD |  |  |  |

## Remediation Backlog
- [ ] 

## Re-test Plan
- Re-run the same monitors after remediation.
- For legal-hold exclusions, run `/audit-legal` separately only when 법률 검토를 재개한다.

## Exit Criteria
- All findings are PASS.
- No open WATCH or BLOCK items remain.
- The product still satisfies AGENTS.md "상품성 100%" definition.
