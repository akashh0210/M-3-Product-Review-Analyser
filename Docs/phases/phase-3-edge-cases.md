# Phase 3 — Edge Cases

## Overview
Phase 3 edge cases cover LLM response quality issues, quote grounding failures, theme clustering problems, and the challenges of working with AI-generated structured output.

---

## Edge Case Matrix

### EC3.1 — LLM Response Issues

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | LLM returns invalid JSON | Model hallucination | Retry up to 3x with stricter prompt; log each attempt | 🔴 Critical |
| 2 | LLM returns JSON wrapped in markdown | ` ```json { } ``` ` | Strip markdown code fences before parsing | 🟡 Medium |
| 3 | LLM returns extra text before/after JSON | `"Here are the themes: { ... }"` | Extract JSON with regex `/\{[\s\S]*\}/` | 🟡 Medium |
| 4 | LLM returns empty response | API glitch | Retry; if still empty, throw with message | 🔴 Critical |
| 5 | LLM returns themes with wrong schema | Missing `sentiment` field | Use default values for missing fields | 🟡 Medium |
| 6 | LLM returns more than maxThemes | Returns 8 themes when max is 5 | Truncate to maxThemes, sorted by count | 🟢 Low |
| 7 | LLM returns only 1 theme | Everything grouped together | Accept — log warning, proceed with 1 theme | 🟡 Medium |
| 8 | LLM response is truncated (hit max tokens) | Long response needed | Detect incomplete JSON, retry with higher maxTokens | 🟡 Medium |
| 9 | LLM rate limited (429) | Too many calls | Exponential backoff: wait 2s, 4s, 8s; max 3 retries | 🔴 Critical |
| 10 | LLM timeout | Slow model response | 60s timeout; retry once; log warning | 🟡 Medium |

### EC3.2 — Theme Clustering Edge Cases

| # | Scenario | Input | Expected Behavior | Severity |
|---|----------|-------|--------------------|----------|
| 1 | Very few reviews (3–5) | Small dataset | LLM may return 1–2 themes — acceptable | 🟡 Medium |
| 2 | All reviews are positive | All 5★ reviews | Themes should reflect positive topics; sentiment = positive | 🟢 Low |
| 3 | All reviews are negative | All 1★ reviews | Themes focus on complaints; sentiment = negative | 🟢 Low |
| 4 | All reviews say the same thing | "App crashes" x 100 | Single theme with high count — acceptable | 🟢 Low |
| 5 | Reviews in mixed languages | English + Hindi | LLM should group by topic regardless of language | 🟡 Medium |
| 6 | Reviews with only emojis | "😡😡😡" | LLM may not cluster effectively — acceptable in v1 | 🟢 Low |
| 7 | Very long reviews (>1000 chars) | User essays | Truncate to 500 chars when building LLM prompt | 🟡 Medium |
| 8 | ReviewIndices point to wrong reviews | LLM miscounts | Validate indices are within bounds; clamp to valid range | 🟡 Medium |
| 9 | Theme labels are too generic | "Good", "Bad" | Log warning — note that label quality depends on LLM | 🟢 Low |
| 10 | Theme counts don't add up | Count says 50 but only 30 indices | Use `reviewIndices.length` as the true count | 🟡 Medium |
| 11 | Large batch (500+ reviews) | High-volume app | Batch into chunks of 80–100, consolidate themes | 🟡 Medium |
| 12 | Consolidation merges all into 1 theme | Over-aggressive merging | Set minimum of 2 themes if input had diverse content | 🟢 Low |

### EC3.3 — Quote Grounding Edge Cases

| # | Scenario | Input | Expected Behavior | Severity |
|---|----------|-------|--------------------|----------|
| 1 | LLM fabricates a quote | Quote not in any review | Grounding check fails → re-prompt | 🔴 Critical |
| 2 | LLM paraphrases a quote | Close but not exact match | Grounding check fails → re-prompt | 🔴 Critical |
| 3 | LLM adds/removes punctuation | `"App crashes."` vs `"App crashes"` | Try fuzzy match (strip trailing punctuation) | 🟡 Medium |
| 4 | Quote spans partial sentence | `"crashes when I open"` from longer review | Substring check passes — valid | 🟢 Low |
| 5 | Quote is the entire review | Short review used as quote | Valid — grounding check passes | 🟢 Low |
| 6 | Quote contains [REDACTED] | PII was scrubbed | Valid — quote is from scrubbed text | 🟢 Low |
| 7 | All 3 retries fail grounding | LLM keeps fabricating | Fall back to first sentence of a review from that theme | 🟡 Medium |
| 8 | Quote from wrong theme | Quote assigned to Theme 1 but text is in Theme 2 | Accept — cross-theme quotes are okay as long as grounded | 🟢 Low |
| 9 | Same quote selected twice | LLM picks duplicate | Detect duplicate, ask for replacement | 🟡 Medium |
| 10 | Quote is very short (<10 chars) | `"Bad app"` | Accept — short quotes are valid if grounded | 🟢 Low |
| 11 | Quote is very long (>200 chars) | Full paragraph quoted | Accept — but may be trimmed in the weekly note | 🟢 Low |

### EC3.4 — Action Idea Edge Cases

| # | Scenario | Input | Expected Behavior | Severity |
|---|----------|-------|--------------------|----------|
| 1 | Actions are vague | `"Improve the app"` | Log warning — quality depends on LLM prompt | 🟡 Medium |
| 2 | Actions are too specific | `"Fix bug #12345"` | Accept — specificity is good | 🟢 Low |
| 3 | Actions don't match themes | Random actions | Log warning — prompt should enforce alignment | 🟡 Medium |
| 4 | Actions are duplicates | Same action twice | Detect and re-prompt for unique actions | 🟡 Medium |
| 5 | Fewer than 3 actions returned | LLM returns only 2 | Re-prompt asking for exactly 3; if still <3, pad with "Investigate further" | 🟡 Medium |

---

## Grounding Validation Code

```typescript
function validateQuoteGrounding(quote: string, reviews: Review[]): boolean {
  // Exact substring match
  if (reviews.some(r => r.text.includes(quote))) return true;

  // Fuzzy match: strip trailing punctuation and try again
  const cleaned = quote.replace(/[.,!?;:]+$/, '').trim();
  if (reviews.some(r => r.text.includes(cleaned))) return true;

  // Case-insensitive match as last resort
  const lower = cleaned.toLowerCase();
  if (reviews.some(r => r.text.toLowerCase().includes(lower))) return true;

  return false;
}
```

## Test Scenarios

### Test 1: Force Quote Fabrication
Modify the LLM prompt temporarily to ask for a quote that doesn't exist. Verify the grounding check catches it and re-prompts.

### Test 2: Small Dataset
Use only 5 reviews. Verify the pipeline produces at least 1 theme and adapts gracefully.

### Test 3: Batch Consolidation
Use 300 reviews. Verify batching produces merged themes without duplicates.
