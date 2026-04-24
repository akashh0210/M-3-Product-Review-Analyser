# Phase 3 — Evaluation Criteria

## Overview
Phase 3 evaluates the AI analysis layer — theme clustering and grounded quote selection. This is the most critical phase for output quality. Evaluation focuses on theme relevance, quote grounding accuracy, and LLM error handling.

---

## Evaluation Checklist

### E3.1 — Theme Clustering (`src/process/themeCluster.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `clusterThemes()` exported | Import | No error |
| 2 | Returns ThemeGroup array | Call with review data | Valid array returned |
| 3 | Returns ≤ maxThemes themes | Check array length | `themes.length <= config.maxThemes` |
| 4 | Returns ≥ 1 theme | Check array length | At least 1 theme |
| 5 | Each theme has `label` | Inspect objects | Non-empty string |
| 6 | Each theme has `count` | Inspect objects | Positive integer |
| 7 | Each theme has `sentiment` | Inspect objects | One of: positive, negative, mixed |
| 8 | Each theme has `summary` | Inspect objects | Non-empty string |
| 9 | Each theme has `reviewIndices` | Inspect objects | Array of valid indices |
| 10 | Themes sorted by count desc | Check order | `themes[0].count >= themes[1].count` |
| 11 | Review indices are valid | Cross-reference with review array | All indices < reviews.length |
| 12 | Sum of counts is reasonable | Add all counts | Should be ≥ totalReviews (reviews can be in multiple themes) |
| 13 | Theme labels are descriptive | Read them | Not generic like "Theme 1" |
| 14 | Batching works for >100 reviews | Test with 200+ reviews | Themes still generated correctly |
| 15 | LLM returns valid JSON | Check parsing | `JSON.parse()` succeeds |

### E3.2 — Quote Selection (`src/process/quoteSelector.ts`)

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `selectQuotesAndActions()` exported | Import | No error |
| 2 | Returns exactly 3 quotes | Check array length | `quotes.length === 3` |
| 3 | Returns exactly 3 actions | Check array length | `actions.length === 3` |
| 4 | Each quote has `text` | Inspect objects | Non-empty string |
| 5 | Each quote has `theme` | Inspect objects | Matches a top theme label |
| 6 | Each quote has `rating` | Inspect objects | Number 1–5 |
| 7 | **Quote 1 is grounded** | `reviews.some(r => r.text.includes(quote1.text))` | `true` |
| 8 | **Quote 2 is grounded** | Same check | `true` |
| 9 | **Quote 3 is grounded** | Same check | `true` |
| 10 | Each action has `title` | Inspect objects | Non-empty, concise |
| 11 | Each action has `description` | Inspect objects | 1–2 sentences |
| 12 | Each action has `theme` | Inspect objects | Matches a top theme label |
| 13 | Actions are actionable | Human review | Concrete, not vague platitudes |
| 14 | One quote per theme | Check theme assignments | Each top theme represented |
| 15 | One action per theme | Check theme assignments | Each top theme addressed |

### E3.3 — LLM Integration Quality

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | JSON mode produces valid JSON | Check all LLM responses | Always parseable |
| 2 | Retry on invalid JSON works | Force an error, check retry | Succeeds on retry |
| 3 | Rate limit handling | Monitor for 429 errors | Retries with backoff |
| 4 | Token usage logged | Check stdout | Shows input/output tokens |
| 5 | Response time logged | Check stdout | Shows seconds per call |
| 6 | Prompts are well-structured | Review prompt construction | Clear instructions, structured format |

### E3.4 — Grounding Validation

| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | All 3 quotes found in review text | Substring search in reviews | 3/3 pass |
| 2 | Quote validation runs automatically | Check pipeline code | Validation after LLM call |
| 3 | Failed grounding triggers re-prompt | Force LLM to fabricate | Re-prompt logged |
| 4 | Fallback works after 3 failed retries | Simulate persistent failure | Falls back to first sentence of a review |

---

## Scoring

| Category | Weight | Max Score |
|----------|--------|-----------|
| Theme clustering correctness | 25% | 25 |
| Quote grounding (all 3 must pass) | 30% | 30 |
| Action quality | 15% | 15 |
| LLM error handling | 15% | 15 |
| Batching for large datasets | 10% | 10 |
| Logging and diagnostics | 5% | 5 |
| **Total** | **100%** | **100** |

**Pass threshold: 80/100** — Quote grounding is mandatory (zero tolerance for fabricated quotes).
