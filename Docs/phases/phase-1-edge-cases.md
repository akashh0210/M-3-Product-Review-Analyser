# Phase 1 — Edge Cases

## Overview
Phase 1 edge cases focus on network failures, scraper library quirks, unexpected API responses, and the reliability of the CSV fallback path.

---

## Edge Case Matrix

### EC1.1 — Network & API Failures

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | No internet connection | Disconnect WiFi/Ethernet | Both fetchers catch error, log warning, trigger CSV fallback | 🔴 Critical |
| 2 | App Store API timeout | Slow network / VPN | Timeout after 30s, log error, return empty array | 🔴 Critical |
| 3 | Play Store API timeout | Slow network / VPN | Timeout after 30s, log error, return empty array | 🔴 Critical |
| 4 | App Store rate-limited | Too many requests | Catch 429 error, log warning, return whatever was fetched so far | 🟡 Medium |
| 5 | Play Store rate-limited | Too many requests | Same as above | 🟡 Medium |
| 6 | DNS resolution failure | Bad DNS config | Catch ENOTFOUND, suggest checking network | 🔴 Critical |

### EC1.2 — Invalid App Identifiers

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | Wrong App Store ID | Set `APP_STORE_ID=999999999` | Scraper returns error/empty; log "App not found", return [] | 🟡 Medium |
| 2 | Wrong Play Store package | Set `PLAY_STORE_PACKAGE=com.fake.app` | Scraper returns error/empty; log "App not found", return [] | 🟡 Medium |
| 3 | App Store ID is not numeric | Set `APP_STORE_ID=abc` | Validate before calling scraper, throw config error | 🟡 Medium |
| 4 | Empty app identifier | `APP_STORE_ID=` | Use default from config, log warning | 🟢 Low |

### EC1.3 — Unusual API Responses

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | App Store returns 0 reviews | New/unpopular app | Log warning, proceed with Play Store only | 🟡 Medium |
| 2 | Play Store returns 0 reviews | New/unpopular app | Log warning, proceed with App Store only | 🟡 Medium |
| 3 | Both stores return 0 reviews | Very new app | Trigger CSV fallback; if no CSV, throw error | 🔴 Critical |
| 4 | Reviews have missing fields | Scraper API change | Handle gracefully — use defaults for missing fields | 🟡 Medium |
| 5 | Review `text` is null/undefined | Rare scraper bug | Skip that review, don't crash | 🟡 Medium |
| 6 | Review `score` is 0 or > 5 | Data corruption | Clamp to 1–5 range | 🟢 Low |
| 7 | Review date is in the future | Clock skew / bad data | Keep it — filter stage will handle date logic | 🟢 Low |
| 8 | Very large review (>5000 chars) | User wrote an essay | Keep it — will be truncated when sent to LLM | 🟢 Low |
| 9 | Review contains only emojis | `"😡😡😡😡"` | Keep it — valid review text | 🟢 Low |
| 10 | Review in non-English language | Hindi/regional reviews | Keep it — LLM can process multilingual text | 🟢 Low |

### EC1.4 — CSV Fallback Edge Cases

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | CSV file has wrong columns | Mismatched header | Log error with expected columns, skip file | 🟡 Medium |
| 2 | CSV file is empty (header only) | No data rows | Return empty array, log warning | 🟡 Medium |
| 3 | CSV file has malformed rows | Unescaped commas | csv-parse should handle; if not, skip malformed rows | 🟡 Medium |
| 4 | CSV file uses different delimiter | Semicolons instead of commas | Detect delimiter or default to comma; log if parsing fails | 🟢 Low |
| 5 | CSV has extra columns | More cols than expected | Ignore extra columns, use only expected ones | 🟢 Low |
| 6 | CSV with BOM (Byte Order Mark) | Windows-generated CSV | Handle BOM in first column name | 🟡 Medium |
| 7 | Multiple CSV files in data/raw/ | Extra files present | Only read expected filenames; ignore others | 🟢 Low |

### EC1.5 — Raw Data Storage

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | `data/raw/` doesn't exist | First run | Create it with `ensureDir()` | 🟢 Low |
| 2 | Previous raw data exists | Rerun | Overwrite with fresh data | 🟢 Low |
| 3 | Raw JSON is very large (>50MB) | Thousands of reviews | Write successfully, no memory issues | 🟡 Medium |
| 4 | PII accidentally in raw JSON | userName slipped in | Raw data is gitignored; PII scrub runs later | 🟡 Medium |

---

## Test Scenarios

### Test 1: Single Store Failure
```bash
# Set invalid App Store ID to simulate failure
# .env: APP_STORE_ID=0
npx tsx src/index.ts
# Expected: App Store fetch fails, Play Store succeeds, pipeline continues
```

### Test 2: Complete Fetch Failure + CSV Fallback
```bash
# Set both IDs to invalid, place CSV in data/raw/
# data/raw/playstore-reviews.csv with 10 sample rows
npx tsx src/index.ts
# Expected: Both fetchers fail, CSV loaded, pipeline continues
```

### Test 3: No Data at All
```bash
# Set both IDs to invalid, remove all CSVs from data/raw/
npx tsx src/index.ts
# Expected: Clear error: "No reviews found. Place CSV files in data/raw/..."
```
