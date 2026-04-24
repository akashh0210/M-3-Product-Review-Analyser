# Phase 4 — Edge Cases

## Overview
Phase 4 edge cases cover weekly note generation issues (word count, formatting), email draft problems, and full pipeline failure scenarios.

---

## Edge Case Matrix

### EC4.1 — Weekly Note Generation

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | LLM generates >250 words | Verbose model response | Re-prompt with stricter word limit; if still over, log warning | 🔴 Critical |
| 2 | LLM generates <50 words | Too brief response | Accept if content is valid; log warning if missing sections | 🟡 Medium |
| 3 | LLM omits themes section | Incomplete generation | Re-prompt asking for all sections | 🟡 Medium |
| 4 | LLM omits quotes | Incomplete generation | Re-prompt asking for blockquotes | 🟡 Medium |
| 5 | LLM omits actions | Incomplete generation | Re-prompt asking for action items | 🟡 Medium |
| 6 | LLM uses wrong markdown syntax | `*bold*` instead of `**bold**` | Accept — still readable | 🟢 Low |
| 7 | LLM invents a 4th theme | Adds an extra theme | Accept — minor deviation, note still useful | 🟢 Low |
| 8 | LLM modifies a quote | Paraphrases in the note | Detect by comparing with original quotes; re-prompt if different | 🟡 Medium |
| 9 | LLM adds disclaimers | "Note: This is AI-generated..." | Strip disclaimer text before saving | 🟢 Low |
| 10 | Only 1 theme available | Small/homogeneous dataset | LLM writes note with 1 theme — acceptable | 🟡 Medium |
| 11 | Only 2 themes available | Small dataset | LLM writes note with 2 themes — acceptable | 🟡 Medium |
| 12 | Average rating is exactly 1.0 | All 1★ reviews | Note should reflect severe issues | 🟢 Low |
| 13 | Average rating is exactly 5.0 | All 5★ reviews | Note should reflect positive sentiment | 🟢 Low |
| 14 | Zero reviews (after filtering) | All filtered out | Cannot generate note — throw error before this stage | 🔴 Critical |

### EC4.2 — Email Draft Generation

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | Weekly note is empty | Previous stage failed | Email should not be generated; log error | 🔴 Critical |
| 2 | Author name is empty | Not configured | Use "Product Team" as fallback | 🟡 Medium |
| 3 | Date range is invalid | Bad dates from reviews | Use "Recent" as date range text | 🟡 Medium |
| 4 | Product name has special chars | Unusual product name | Escape or keep as-is | 🟢 Low |
| 5 | Email is very long | Note was 250 words + email wrapper | Total length is fine — only the note is capped | 🟢 Low |
| 6 | Markdown formatting in email | Bold, headers, blockquotes | Keep — email is markdown format, not plain text | 🟢 Low |

### EC4.3 — MCP Push Edge Cases

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | Neither MCP var set | No GOOGLE_DOC_ID, ENABLE_GMAIL_SEND=false | Stage 6 prints "MCP push skipped", pipeline succeeds | 🟢 Low |
| 2 | GOOGLE_DOC_ID set but no credentials.json | File missing | Auth fails, warning logged, pipeline succeeds | 🟡 Medium |
| 3 | GOOGLE_DOC_ID set but invalid | Non-existent doc ID | API error, warning logged, pipeline succeeds | 🟡 Medium |
| 4 | GOOGLE_DOC_ID set and valid | Working credentials + doc | Note appended to doc, char count logged | 🟢 Low |
| 5 | Google Doc is read-only | No write permission | API permission error, warning logged | 🟡 Medium |
| 6 | OAuth token expired | token.json has expired token | Auto-refresh attempted; if refresh fails, warning logged | 🟡 Medium |
| 7 | OAuth token missing | No token.json | Auth flow starts (logs URL for user); if non-interactive, fails gracefully | 🟡 Medium |
| 8 | ENABLE_GMAIL_SEND=true but no recipients | GMAIL_RECIPIENTS empty | Config validation throws before pipeline runs | 🔴 Critical |
| 9 | ENABLE_GMAIL_SEND=true, valid recipients | Working credentials + valid emails | Email sent, message ID logged | 🟢 Low |
| 10 | Gmail quota exceeded | Too many sends in a day | API error, warning logged, pipeline succeeds | 🟡 Medium |
| 11 | MCP server running | MCP server available | Pipeline uses MCP path, logs "MCP server connected" | 🟢 Low |
| 12 | MCP server not running | No MCP server | Falls back to googleapis, logs "Using googleapis fallback" | 🟡 Medium |
| 13 | Network failure during MCP push | Internet drops after Stage 5 | Timeout, warning logged, local files already saved | 🟡 Medium |

### EC4.4 — Full Pipeline Edge Cases

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | Fetch succeeds but normalize fails | Corrupt raw data | Log error at normalize stage, stop pipeline | 🔴 Critical |
| 2 | Filter removes all reviews | Very narrow window | Stop pipeline with "No reviews in date window" message | 🔴 Critical |
| 3 | LLM calls fail in Phase 3 | API key expired | Log error, suggest checking API key | 🔴 Critical |
| 4 | Partial pipeline success | LLM fails after CSV written | reviews.csv exists but no weekly-note.md; log what was saved | 🟡 Medium |
| 5 | Rerun with existing outputs | Output files already exist | Overwrite with fresh data | 🟢 Low |
| 6 | Pipeline interrupted (Ctrl+C) | User cancels | Partial files may exist — no corruption | 🟢 Low |
| 7 | Disk full during write | No space left | Catch ENOSPC, log error | 🔴 Critical |
| 8 | Very fast run (<5 seconds) | Few reviews, fast LLM | Valid — small datasets process quickly | 🟢 Low |
| 9 | Very slow run (>120 seconds) | Many reviews, slow LLM | Log progress per stage so user knows it's working | 🟡 Medium |

### EC4.4 — Word Count Enforcement

| # | Scenario | First Attempt | Second Attempt | Final Action | Severity |
|---|----------|---------------|----------------|-------------|----------|
| 1 | 248 words | ✅ Accept | — | Save | 🟢 |
| 2 | 250 words | ✅ Accept | — | Save | 🟢 |
| 3 | 255 words | ❌ Re-prompt | 242 words ✅ | Save | 🟡 |
| 4 | 300 words | ❌ Re-prompt | 260 words ❌ | Save with warning log | 🟡 |
| 5 | 500 words | ❌ Re-prompt | 280 words ❌ | Re-prompt again (3rd try) | 🔴 |
| 6 | 50 words | ✅ Accept | — | Save with "note is brief" warning | 🟡 |

---

## Test Scenarios

### Test 1: Word Count Limit
Modify the weekly note prompt to remove the word limit. Verify the enforcement code catches the overrun and re-prompts.

### Test 2: Missing Themes
Use a dataset with only 5 very similar reviews. Verify the pipeline handles having fewer than 3 themes.

### Test 3: Rerunability
Run the pipeline twice. Compare outputs — they should be similar in quality (themes may vary slightly due to LLM temperature).

### Test 4: End-to-End Timing
```bash
time npm run start
# Expected: < 60 seconds for a typical dataset
# Acceptable: < 120 seconds
# Warning: > 120 seconds
```
