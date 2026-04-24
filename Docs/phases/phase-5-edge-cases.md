# Phase 5 — Edge Cases

## Overview
Phase 5 edge cases cover validation failures, cross-phase interaction problems, and real-world deployment scenarios that could surface during the final testing and polish stage.

---

## Edge Case Matrix

### EC5.1 — Validation Script Edge Cases

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | Output files don't exist | Run validate before pipeline | Clear error: "Run the pipeline first" | 🔴 Critical |
| 2 | reviews.csv exists but is empty | Header-only CSV | Validation warns: "No review data found" | 🟡 Medium |
| 3 | weekly-note.md is empty | 0 bytes file | Validation fails: "Weekly note is empty" | 🔴 Critical |
| 4 | Word count is exactly 250 | Borderline | Validation passes (≤ 250) | 🟢 Low |
| 5 | Word count is 251 | Just over limit | Validation fails with count shown | 🟡 Medium |
| 6 | Quote contains special regex chars | Quote has `(`, `)`, `[` | Escape for regex or use `includes()` | 🟡 Medium |
| 7 | Quote grounding check is slow | 10,000 reviews in CSV | Still completes in <5 seconds | 🟢 Low |
| 8 | PII false positive in output | Text like "id=main-section" | Should NOT flag as PII — tune regex | 🟡 Medium |
| 9 | CSV has encoding issues | UTF-8 BOM or Latin-1 | Handle encoding detection | 🟡 Medium |
| 10 | Validation run on stale outputs | Old outputs from previous run | Validation checks current files — note may be outdated | 🟢 Low |

### EC5.2 — Cross-Phase Interaction Edge Cases

| # | Scenario | Phases Involved | Expected Behavior | Severity |
|---|----------|-----------------|--------------------| ---------|
| 1 | Phase 1 fetches 0 reviews, no CSV fallback | Phase 1 → 2 | Pipeline stops after Phase 1 with clear error | 🔴 Critical |
| 2 | Phase 2 filters out all reviews | Phase 2 → 3 | Pipeline stops after Phase 2: "No reviews in date window" | 🔴 Critical |
| 3 | Phase 3 LLM fails completely | Phase 3 → 4 | Pipeline stops: "AI analysis failed. Check API key and network" | 🔴 Critical |
| 4 | Phase 3 produces 1 theme only | Phase 3 → 4 | Phase 4 generates note with 1 theme — warn but proceed | 🟡 Medium |
| 5 | Phase 3 quotes don't match Phase 2 CSV | Phase 2 → 3 | Grounding check fails — re-prompt or fallback | 🔴 Critical |
| 6 | Phase 4 note references wrong product name | Config → Phase 4 | Bug — product name should come from config | 🟡 Medium |
| 7 | Phase 2 PII scrub changes a quote | Phase 2 → 3 | Quote should match the scrubbed version, not the original | 🟡 Medium |
| 8 | Rerun with different product | Config change | All stages use new product config | 🟡 Medium |
| 9 | Rerun with narrower window (8 weeks) | Config change | Fewer reviews, potentially different themes | 🟢 Low |
| 10 | Phase 4 MCP push fails after local save | MCP auth error | Local files (weekly-note.md, email-draft.md) intact, warning logged | 🟡 Medium |
| 11 | Phase 0 MCP config validation + Phase 4 | Gmail enabled but no recipients | Config throws at pipeline start, nothing runs | 🔴 Critical |

### EC5.3 — Real-World Deployment Edge Cases

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | Running on macOS vs Windows | Different OS | Path handling works cross-platform (`path.join`) | 🟡 Medium |
| 2 | Running on Linux CI | CI/CD environment | No interactive prompts, no GUI dependencies | 🟡 Medium |
| 3 | Node.js version 18 vs 20 vs 22 | Different runtime | No version-specific API usage | 🟢 Low |
| 4 | Slow internet connection | Limited bandwidth | Longer timeouts, clear progress logging | 🟡 Medium |
| 5 | Running behind corporate proxy | Proxy blocks API | Groq SDK should respect `HTTPS_PROXY` env var | 🟡 Medium |
| 6 | First run ever (no data, no outputs) | Fresh clone | Pipeline creates directories, fetches data, runs end-to-end | 🔴 Critical |
| 7 | Second consecutive run | Outputs exist | Pipeline overwrites with fresh results | 🟢 Low |
| 8 | Running multiple times quickly | Rate limits | Groq rate limiting triggers — backoff handles it | 🟡 Medium |
| 9 | Git clone + npm install + run | New user | README instructions work perfectly | 🔴 Critical |
| 10 | First run with MCP (no token.json) | OAuth required | Auth URL printed, user pastes code, token.json created | 🟡 Medium |
| 11 | Non-interactive env (CI) with MCP enabled | No browser for OAuth | Auth fails gracefully, pipeline succeeds without MCP push | 🟡 Medium |
| 12 | Google API quota exhausted | Too many API calls in 24h | Rate limit error logged, pipeline succeeds | 🟡 Medium |

### EC5.4 — Demo Recording Edge Cases

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | Pipeline takes >60s during recording | Slow network/LLM | Have a backup pre-recorded run | 🟡 Medium |
| 2 | LLM returns different themes on rerun | Non-deterministic | Set temperature to 0.1 for demo consistency | 🟢 Low |
| 3 | Scraper fails during demo | Store API issue | Use CSV fallback; mention it in demo as resilience feature | 🟢 Low |
| 4 | Terminal output is hard to read | Small font, long lines | Pre-configure terminal with large font, wide window | 🟢 Low |
| 5 | Output file has formatting issues | Markdown rendering | Preview in VS Code markdown preview before recording | 🟢 Low |
| 6 | MCP push slow during demo | Network latency to Google API | Mention it as "pushing to external systems", expected delay | 🟢 Low |
| 7 | MCP push fails during demo | Token expired or wrong doc ID | Show it as graceful degradation — pipeline still succeeds | 🟢 Low |

---

## Comprehensive Test Plan

### Test Suite 1: Happy Path
```bash
# Full pipeline with real data
npm run start
# Verify: all 3 outputs generated, validation passes
npx tsx src/validate.ts
```

### Test Suite 2: Error Recovery
```bash
# Test 2a: Missing API key
# Remove GROQ_API_KEY from .env → expect clear error

# Test 2b: No network
# Disconnect → expect CSV fallback or clear error

# Test 2c: Invalid API key
# Set GROQ_API_KEY=invalid → expect auth error message

# Test 2d: Empty dataset
# Place empty CSV in data/raw/ → expect "no reviews" error
```

### Test Suite 3: Configuration Variations
```bash
# Test 3a: 8-week window
# .env: REVIEW_WINDOW_WEEKS=8
npm run start
# Verify: fewer reviews, still works

# Test 3b: 3 max themes
# .env: MAX_THEMES=3
npm run start
# Verify: max 3 themes in output

# Test 3c: Different product (if supported)
# .env: PRODUCT_NAME=Zerodha
# Update APP_STORE_ID and PLAY_STORE_PACKAGE
npm run start
# Verify: runs for new product
```

### Test Suite 4: Output Quality
```bash
# Test 4a: Word count
wc -w output/weekly-note.md
# Expected: ≤ 250

# Test 4b: PII check
grep -iE "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" output/*.md output/*.csv
# Expected: no matches (or only [REDACTED])

# Test 4c: Quote grounding
# For each quote in weekly-note.md, search for it in reviews.csv
# Expected: all 3 found
```

### Test Suite 5: MCP Integration
```bash
# Test 5a: MCP skipped (no config)
# Remove GOOGLE_DOC_ID and ENABLE_GMAIL_SEND from .env
npm run start
# Expected: "MCP push skipped (not configured)"

# Test 5b: Google Doc append
# Set GOOGLE_DOC_ID=<valid_doc_id> in .env
# Ensure credentials.json and token.json exist
npm run start
# Expected: "Appended N chars to Google Doc"

# Test 5c: Gmail send
# Set ENABLE_GMAIL_SEND=true, GMAIL_RECIPIENTS=your@email.com
npm run start
# Expected: "Email sent (ID: ...)"

# Test 5d: MCP auth failure
# Set GOOGLE_DOC_ID=<valid_id>, delete credentials.json
npm run start
# Expected: Warning logged, pipeline still completes with local files

# Test 5e: Invalid doc ID
# Set GOOGLE_DOC_ID=invalid_id_12345
npm run start
# Expected: Warning logged, pipeline still completes
```

### Test Suite 6: Rerunability
```bash
# Run 1
npm run start
cp output/weekly-note.md /tmp/run1.md

# Run 2
npm run start
diff output/weekly-note.md /tmp/run1.md
# Expected: may differ slightly (LLM non-determinism) but same structure
```
