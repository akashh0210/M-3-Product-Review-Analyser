# Phase 1 — Evaluation Criteria

## Overview
Phase 1 evaluates the review fetching layer. The fetchers must pull real reviews from both stores, exclude PII fields, save raw data for auditing, and handle failures gracefully with CSV fallback.

---

## Evaluation Checklist

### E1.1 — App Store Fetcher (`src/fetch/appStore.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Function exported | Import `fetchAppStoreReviews` | No import error |
| 2 | Returns array of reviews | Call with Groww app ID | Array with length > 0 |
| 3 | Each review has `score` | Inspect returned objects | Number 1–5 |
| 4 | Each review has `title` | Inspect returned objects | String (may be empty) |
| 5 | Each review has `text` | Inspect returned objects | Non-empty string |
| 6 | Each review has `updated` | Inspect returned objects | Valid date string |
| 7 | Each review has `version` | Inspect returned objects | String (may be "unknown") |
| 8 | **No `userName` field** | Inspect returned objects | Field absent — PII excluded |
| 9 | **No `userUrl` field** | Inspect returned objects | Field absent — PII excluded |
| 10 | **No `id` field** | Inspect returned objects | Field absent — PII excluded |
| 11 | Pagination fetches multiple pages | Check total count | > 50 reviews (multi-page) |
| 12 | Raw data saved to disk | Check `data/raw/appstore-reviews.json` | File exists with valid JSON |
| 13 | Console log shows count | Check stdout | "Fetched N App Store reviews" |

### E1.2 — Play Store Fetcher (`src/fetch/playStore.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Function exported | Import `fetchPlayStoreReviews` | No import error |
| 2 | Returns array of reviews | Call with Groww package | Array with length > 0 |
| 3 | Each review has `score` | Inspect returned objects | Number 1–5 |
| 4 | Each review has `text` | Inspect returned objects | Non-empty string |
| 5 | Each review has `date` | Inspect returned objects | Valid date string |
| 6 | `title` may be null | Inspect returned objects | String or null |
| 7 | `version` may be null | Inspect returned objects | String or null |
| 8 | **No `userName` field** | Inspect returned objects | Field absent |
| 9 | **No `userImage` field** | Inspect returned objects | Field absent |
| 10 | Fetches substantial reviews | Check total count | > 100 reviews |
| 11 | Raw data saved to disk | Check `data/raw/playstore-reviews.json` | File exists with valid JSON |
| 12 | Console log shows count | Check stdout | "Fetched N Play Store reviews" |

### E1.3 — CSV Fallback

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Fallback triggers when both fetchers fail | Disable network, run pipeline | Looks for CSV in data/raw/ |
| 2 | Reads `data/raw/appstore-reviews.csv` | Place test CSV | Reviews loaded from file |
| 3 | Reads `data/raw/playstore-reviews.csv` | Place test CSV | Reviews loaded from file |
| 4 | Handles missing CSVs | No CSVs in data/raw/ | Clear error message |
| 5 | CSV format matches expected columns | Inspect parsing | source, rating, title, text, date, version |

### E1.4 — Pipeline Integration

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Combined count printed | Run pipeline | "Total raw reviews: N" |
| 2 | Both sources combined | Inspect combined array | Mix of App Store + Play Store |
| 3 | Pipeline continues after fetch | Run pipeline | No crash, prints next stage message |

---

## Scoring

| Category | Weight | Max Score |
|----------|--------|-----------|
| App Store fetcher | 30% | 30 |
| Play Store fetcher | 30% | 30 |
| PII exclusion (both) | 15% | 15 |
| CSV fallback | 15% | 15 |
| Pipeline integration | 10% | 10 |
| **Total** | **100%** | **100** |

**Pass threshold: 80/100** — Both fetchers must return data; PII exclusion is mandatory.
