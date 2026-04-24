# Phase 5 — Evaluation Criteria

## Overview
Phase 5 evaluates the validation framework, edge case handling (including MCP), CLI polish, and overall project readiness for submission. This is the final quality gate before the project is considered complete.

---

## Evaluation Checklist

### E5.1 — Validation Script (`src/validate.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Script runs independently | `npx tsx src/validate.ts` | Exits with pass/fail status |
| 2 | Checks word count | Run on output | Reports word count ≤ 250 |
| 3 | Checks theme count | Run on output | Reports exactly 3 themes |
| 4 | Checks quote grounding | Run on output | All 3 quotes found in reviews.csv |
| 5 | Checks PII absence | Run on output | Zero PII patterns in all outputs |
| 6 | Checks CSV integrity | Run on output | CSV parses without errors |
| 7 | Checks file existence | Run on output | All 3 files exist and are non-empty |
| 8 | Clear pass/fail output | Read stdout | Summary with ✅/❌ per check |
| 9 | Returns non-zero exit code on failure | Force a failure | Process exits with code 1 |
| 10 | MCP config check (if configured) | Set GOOGLE_DOC_ID without credentials | Reports warning (informational) |
| 11 | MCP checks skipped when not configured | Omit MCP env vars | Prints "MCP not configured — skipping MCP checks" |

### E5.2 — Edge Case Resilience

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | No .env file | Delete .env, run pipeline | Clear error message, no crash |
| 2 | Invalid API key | Wrong key in .env | Error logged, pipeline stops gracefully |
| 3 | Network disconnected | Disable network, run pipeline | CSV fallback attempted, clear messaging |
| 4 | Empty dataset (0 reviews) | Empty CSV in data/raw/ | Pipeline stops with clear message |
| 5 | Tiny dataset (3 reviews) | CSV with 3 rows | Pipeline completes with warnings |
| 6 | All old reviews | Reviews from 1 year ago | Filter returns 0, clear error |
| 7 | LLM returns invalid JSON | Corrupt API response | Retry logic kicks in |
| 8 | Quote grounding fails | LLM fabricates quotes | Re-prompt or fallback |
| 9 | Word count over limit | LLM writes 300 words | Re-prompt enforced |
| 10 | MCP: No credentials.json | Set GOOGLE_DOC_ID without credentials | Warning logged, pipeline succeeds |
| 11 | MCP: Invalid doc ID | Set GOOGLE_DOC_ID=invalid | Warning logged, pipeline succeeds |
| 12 | MCP: Gmail without recipients | Set ENABLE_GMAIL_SEND=true, empty GMAIL_RECIPIENTS | Config validation throws |

### E5.3 — CLI Experience

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `npm run start` works | Run command | Pipeline executes |
| 2 | Progress visible per stage | Watch stdout | Each stage logged with emoji |
| 3 | Stage timing shown | Watch stdout | Duration per stage or total |
| 4 | Error messages are helpful | Trigger errors | Messages tell user what to fix |
| 5 | Final summary is clear | Check last output | Lists all output files |
| 6 | `--help` flag (if implemented) | `npx tsx src/index.ts --help` | Shows usage info |

### E5.4 — README Completeness

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Setup instructions work | Follow README from scratch | Can go from clone to first run |
| 2 | Rerun steps documented | Read "Rerun for a New Week" section | Clear, numbered steps |
| 3 | Theme legend present | Read "Theme Legend" section | Categories listed with descriptions |
| 4 | Author credited | Check bottom | "Sk Akash Ali" |
| 5 | Problem statement referenced | Check for link/section | Problem context included |
| 6 | MCP setup section present | Read "MCP Setup (Optional)" | Steps for Google Cloud, OAuth, env vars documented |

### E5.5 — Deliverables Completeness

| # | Deliverable | File/Location | Verification |
|---|-------------|---------------|-------------|
| 1 | Working prototype | `npm run start` | Pipeline completes successfully |
| 2 | Weekly note | `output/weekly-note.md` | File exists, ≤250 words, 3 themes + 3 quotes + 3 actions |
| 3 | Email draft | `output/email-draft.md` | File exists, professional format |
| 4 | Reviews CSV | `output/reviews.csv` | File exists, proper columns, no PII |
| 5 | README | `README.md` | Rerun steps + theme legend included |
| 6 | Problem statement | `Docs/problemstatement.md` | Present and clean |
| 7 | Architecture doc | `Docs/architecture.md` | Present and comprehensive (includes §9 MCP) |
| 8 | MCP integration (optional) | Set MCP env vars, run pipeline | Google Doc updated and/or Gmail sent |

### E5.6 — Demo Readiness

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Clean run under 60s | Time the pipeline | < 60 seconds |
| 2 | Output is presentable | Read outputs | Professional quality |
| 3 | No errors in console | Run clean | Zero errors in output |
| 4 | Rerun produces results | Run twice | Second run also works |
| 5 | Demo script prepared | Review demo notes | Steps documented for recording |

---

## Scoring

| Category | Weight | Max Score |
|----------|--------|-----------|
| Validation script | 25% | 25 |
| Edge case resilience | 25% | 25 |
| CLI experience | 15% | 15 |
| README completeness | 10% | 10 |
| Deliverables complete | 15% | 15 |
| Demo readiness | 10% | 10 |
| **Total** | **100%** | **100** |

**Pass threshold: 85/100** — All deliverables must be present; validation script must pass all checks.

---

## Final Project Scorecard

| Phase | Weight | Criteria |
|-------|--------|----------|
| Phase 0 — Scaffolding | 10% | Config, deps, utilities working |
| Phase 1 — Fetching | 15% | Both stores + fallback working |
| Phase 2 — Processing | 20% | Clean CSV, no PII, proper filtering |
| Phase 3 — Analysis | 25% | Relevant themes, grounded quotes, useful actions |
| Phase 4 — Generation | 20% | ≤250 word note, professional email, MCP push, full pipeline |
| Phase 5 — Testing | 10% | Validation passes, edge cases handled |
| **Total** | **100%** | **Overall project quality** |

**Project pass threshold: 80/100 overall, with mandatory checks (PII, quote grounding, word count) all passing.**
