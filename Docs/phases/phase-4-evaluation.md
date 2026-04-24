# Phase 4 — Evaluation Criteria

## Overview
Phase 4 evaluates the output generation layer — the weekly note, email draft, and optional MCP push — as well as the full end-to-end pipeline integration. The weekly note is the primary deliverable and must meet strict formatting and word count requirements. MCP push checks are soft (informational) and do not block a passing score.

---

## Evaluation Checklist

### E4.1 — Weekly Note (`src/generate/weeklyNote.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `generateWeeklyNote()` exported | Import | No error |
| 2 | Returns a markdown string | Check type | `typeof result === 'string'` |
| 3 | **Word count ≤ 250** | `text.split(/\s+/).filter(w => w.length > 0).length` | ≤ 250 |
| 4 | Contains product name | Search for "Groww" | Found in note |
| 5 | Contains date range | Search for date strings | Period mentioned |
| 6 | Contains review count | Search for number | Total reviews mentioned |
| 7 | Contains 3 themes | Count theme entries | Exactly 3 listed |
| 8 | Contains 3 quotes | Count blockquotes (`>`) | Exactly 3 found |
| 9 | Contains 3 actions | Count action items | Exactly 3 listed |
| 10 | Uses markdown formatting | Check for `#`, `**`, `>` | Proper markdown syntax |
| 11 | Has a clear heading | Check first line | Starts with `#` |
| 12 | Quotes are in blockquote format | Lines starting with `>` | Properly formatted |
| 13 | Readable and scannable | Human review | Clear structure, no wall of text |
| 14 | File saved to `output/weekly-note.md` | File check | File exists with content |
| 15 | No PII in generated note | PII regex scan | Zero matches |
| 16 | Re-prompt triggered if >250 words | Log check | Re-prompt logged (if applicable) |

### E4.2 — Email Draft (`src/generate/emailDraft.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `generateEmailDraft()` exported | Import | No error |
| 2 | Returns a markdown string | Check type | `typeof result === 'string'` |
| 3 | Contains "Subject:" line | Search | Subject line present |
| 4 | Subject includes product name | Inspect subject | "Groww" in subject |
| 5 | Subject includes date range | Inspect subject | Date range in subject |
| 6 | Contains "To:" field | Search | Recipients listed |
| 7 | Contains "From:" field | Search | Author listed |
| 8 | Contains greeting | Search for "Hi" or "Hello" | Professional greeting |
| 9 | Contains weekly note content | Compare | Weekly note embedded |
| 10 | Contains closing | Search for "Best" or "Regards" | Professional closing |
| 11 | Author name is correct | Inspect | "Sk Akash Ali" |
| 12 | File saved to `output/email-draft.md` | File check | File exists with content |
| 13 | Professional tone | Human review | Suitable for stakeholders |

### E4.3 — Full Pipeline Integration (`src/index.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Pipeline runs end-to-end | `npm run start` | Exit code 0 |
| 2 | All stages logged | Check stdout | Every stage printed |
| 3 | All 3 output files generated | `ls output/` | reviews.csv, weekly-note.md, email-draft.md |
| 4 | `reviews.csv` has data | Check file size | > 0 bytes, multiple rows |
| 5 | `weekly-note.md` has content | Check file size | > 100 bytes |
| 6 | `email-draft.md` has content | Check file size | > 200 bytes |
| 7 | Total runtime < 120 seconds | Check timing log | `Total time: < 120s` |
| 8 | Error in one stage doesn't crash all | Simulate a stage failure | Pipeline logs error, continues or stops gracefully |
| 9 | Final summary printed | Check last lines of stdout | Shows all output files |
| 10 | Rerunnable | Delete outputs, run again | Same quality results |

### E4.4 — Optional MCP Push (`src/index.ts` / `src/utils/mcp.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | MCP skipped when not configured | Run without MCP env vars | Prints "MCP push skipped", no error |
| 2 | Google Doc append works | Set `GOOGLE_DOC_ID`, run pipeline | Prints "Appended N chars to Google Doc" |
| 3 | Gmail send works | Set `ENABLE_GMAIL_SEND=true` + `GMAIL_RECIPIENTS` | Prints "Email sent (ID: ...)" |
| 4 | Invalid Google Doc ID → warning | Set `GOOGLE_DOC_ID=invalid` | Prints warning, pipeline still completes |
| 5 | Missing credentials.json → warning | Set `GOOGLE_DOC_ID` without credentials file | Prints auth error, pipeline still completes |
| 6 | MCP failure never crashes pipeline | Any MCP error | Exit code still 0, local files intact |
| 7 | Local files generated before MCP | Check file timestamps | output/*.md exist before MCP push runs |

### E4.5 — Content Quality (Human Review)

| # | Check | Reviewer Action | Pass Criteria |
|---|-------|-----------------|---------------|
| 1 | Weekly note is useful | Read the note as a PM | Would you act on this information? |
| 2 | Themes reflect real issues | Cross-reference with reviews.csv | Themes match actual review content |
| 3 | Quotes are impactful | Read each quote | Representative of the theme, not bland |
| 4 | Actions are implementable | Read each action | A team could actually do this |
| 5 | Email is stakeholder-ready | Read the email draft | Would you send this to your VP? |
| 6 | No grammatical errors | Proofread | Clean, professional language |

---

## Scoring

| Category | Weight | Max Score |
|----------|--------|-----------|
| Weekly note format + word count | 20% | 20 |
| Weekly note content quality | 15% | 15 |
| Email draft completeness | 15% | 15 |
| Full pipeline integration | 15% | 15 |
| MCP push (optional, soft check) | 10% | 10 |
| Output files valid | 10% | 10 |
| Content quality (human review) | 15% | 15 |
| **Total** | **100%** | **100** |

**Pass threshold: 80/100** — Word count and quote grounding are hard requirements. MCP checks are bonus points — full marks achievable without MCP if not configured.
