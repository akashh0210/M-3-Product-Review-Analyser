# Phase 2 — Evaluation Criteria

## Overview
Phase 2 evaluates the data processing layer: normalization, date filtering, and PII scrubbing. The key output is `output/reviews.csv` — a clean, filtered, de-identified dataset.

---

## Evaluation Checklist

### E2.1 — Normalization (`src/process/normalize.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `normalizeAppStoreReviews()` exported | Import | No error |
| 2 | `normalizePlayStoreReviews()` exported | Import | No error |
| 3 | `normalizeAll()` exported | Import | No error |
| 4 | App Store reviews have `source: "app_store"` | Inspect output | All marked correctly |
| 5 | Play Store reviews have `source: "play_store"` | Inspect output | All marked correctly |
| 6 | Rating is 1–5 integer | Inspect output | No values outside range |
| 7 | Date is YYYY-MM-DD format | Regex check | All dates match `/^\d{4}-\d{2}-\d{2}$/` |
| 8 | Empty-text reviews excluded | Include empty text in input | Not in output |
| 9 | Null Play Store title → empty string | Include null title | Becomes `""` not `"null"` |
| 10 | Null Play Store version → "unknown" | Include null version | Becomes `"unknown"` |
| 11 | Combined output has both sources | Check normalizeAll() | Mix of app_store and play_store |
| 12 | Total count logged | Check stdout | "Normalized N reviews" |

### E2.2 — Date Filtering (`src/process/filterRecent.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `filterRecentReviews()` exported | Import | No error |
| 2 | Reviews within window kept | Include recent reviews | Present in output |
| 3 | Reviews outside window removed | Include old review (6 months ago) | Absent from output |
| 4 | Boundary date included | Review exactly on cutoff date | Included (≥ cutoff) |
| 5 | Output sorted newest first | Inspect order | First review has latest date |
| 6 | Default window is 12 weeks | Omit parameter | Uses 12 weeks |
| 7 | Custom window works | Pass `windowWeeks: 8` | Filters to 8 weeks |
| 8 | Before/after counts logged | Check stdout | "Reviews in window: X / Y" |
| 9 | Date range logged | Check stdout | Shows cutoff and today dates |

### E2.3 — PII Scrubbing (`src/process/piiScrub.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `scrubPII()` exported | Import | No error |
| 2 | Email redacted | Input: `"contact me at user@gmail.com"` | Output: `"contact me at [REDACTED]"` |
| 3 | Indian phone redacted | Input: `"call +91 98765 43210"` | Output: `"call [REDACTED]"` |
| 4 | International phone redacted | Input: `"call +1-555-123-4567"` | Output: `"call [REDACTED]"` |
| 5 | Self-identification redacted | Input: `"my name is Rahul Kumar"` | Output: `"[REDACTED]"` |
| 6 | Account ref redacted | Input: `"account #ABC12345"` | Output: `"[REDACTED]"` |
| 7 | UPI ID redacted | Input: `"pay to user@paytm"` | Output: `"pay to [REDACTED]"` |
| 8 | Title field also scrubbed | PII in title | Redacted in output |
| 9 | Non-PII text unchanged | Normal review text | Identical to input |
| 10 | Redaction count returned | Check `scrubResult.redactionCount` | Matches actual redactions |
| 11 | Multiple PII in one review | Input with email + phone | Both redacted |
| 12 | No false positives on common words | `"I am happy with the app"` | Not redacted (no capitalized name follows) |

### E2.4 — CSV Output

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `output/reviews.csv` exists | File check | File present |
| 2 | Header row correct | Read first line | `source,rating,title,text,date,version` |
| 3 | Data rows match review count | Count rows | Matches filtered + scrubbed count |
| 4 | CSV properly escaped | Include commas and quotes in text | No broken rows |
| 5 | Parseable by csv-parse | Read and parse | No errors |
| 6 | Parseable by Excel | Open in Excel | Correct column alignment |
| 7 | No PII in any cell | Search for email/phone patterns | Zero matches |
| 8 | All dates within window | Check date column | All ≥ cutoff date |

---

## Scoring

| Category | Weight | Max Score |
|----------|--------|-----------|
| Normalization correctness | 25% | 25 |
| Date filtering accuracy | 20% | 20 |
| PII scrubbing completeness | 30% | 30 |
| CSV output integrity | 15% | 15 |
| Logging and diagnostics | 10% | 10 |
| **Total** | **100%** | **100** |

**Pass threshold: 85/100** — PII scrubbing checks are all mandatory (zero tolerance for PII leaks).
