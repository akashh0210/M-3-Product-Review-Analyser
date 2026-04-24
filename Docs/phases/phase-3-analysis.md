# Phase 3 — AI-Powered Theme Clustering & Quote Selection

## Goal

Use the Groq LLM to analyze the cleaned reviews from Phase 2 and produce:
1. **Up to 5 themes** — High-level buckets grouping related feedback
2. **3 grounded quotes** — Exact text from real reviews representing the top 3 themes
3. **3 action ideas** — Concrete, actionable recommendations based on the themes

This is the core intelligence layer of the pipeline.

## Prerequisites

- Phase 2 complete (`output/reviews.csv` exists with clean reviews)
- `src/utils/llm.ts` working (Groq API key configured)
- `groq-sdk` installed

## Files to Create

| File | Purpose |
|------|---------|
| `src/process/themeCluster.ts` | Groups reviews into ≤5 themes via LLM |
| `src/process/quoteSelector.ts` | Extracts 3 grounded quotes + 3 action ideas via LLM |

## Files to Modify

| File | Change |
|------|--------|
| `src/index.ts` | Add theme clustering and quote selection stages |

---

## Task 3.1 — Implement `src/process/themeCluster.ts`

### Function Signature
```typescript
async function clusterThemes(
  reviews: Review[],
  maxThemes: number,
  apiKey: string
): Promise<ThemeGroup[]>
```

### LLM Prompt Design

**System prompt:**
```
You are a product analyst examining app reviews for a mobile application.
Your job is to identify the main themes in user feedback.
You must return valid JSON only, no other text.
```

**User prompt (template):**
```
Analyze the following {count} app reviews for {productName} and group them
into a maximum of {maxThemes} distinct themes.

For each theme, provide:
- "label": A short descriptive name (e.g. "App Crashes & Performance")
- "count": How many reviews belong to this theme
- "sentiment": "positive", "negative", or "mixed"
- "summary": A 1-2 sentence summary of what users are saying
- "reviewIndices": An array of the review numbers (0-indexed) that belong to this theme

A single review may belong to multiple themes if relevant.
Sort themes by count descending.

Return a JSON object in this exact format:
{
  "themes": [
    {
      "label": "...",
      "count": ...,
      "sentiment": "...",
      "summary": "...",
      "reviewIndices": [...]
    }
  ]
}

Here are the reviews (numbered):

{numbered_reviews}
```

### Batching Strategy

The LLM has a context window limit. If there are more than **100 reviews**, batch them:

1. Split reviews into chunks of 80–100
2. Send each chunk to the LLM for theme clustering
3. Collect all theme results
4. Send a **consolidation prompt** to merge similar themes across batches:
   ```
   You received theme results from multiple batches of reviews.
   Merge similar themes together. Keep the total to {maxThemes} or fewer.
   Return the same JSON format as before.

   Batch results:
   {all_batch_themes_json}
   ```

### LLM Call Configuration

| Parameter | Value |
|-----------|-------|
| Model | `llama-3.1-70b-versatile` |
| Temperature | `0.2` (low — we want consistent grouping) |
| Max tokens | `2048` |
| JSON mode | `true` |

### Preparing Review Text for the Prompt

Format each review as a numbered entry:
```
[0] (★4, app_store) "Title: Great app | Love the investment options and clean UI"
[1] (★1, play_store) "App crashes every time I check my portfolio after the update"
[2] (★3, app_store) "Title: KYC issues | Took 2 weeks for KYC verification"
...
```

Include rating and source for context, but keep it compact.

### Response Parsing

1. Parse the LLM response as JSON
2. Validate the structure: must have `themes` array
3. Each theme must have `label`, `count`, `sentiment`, `summary`, `reviewIndices`
4. If JSON parsing fails, retry up to 3 times with a stricter prompt
5. Sort themes by `count` descending
6. Truncate to `maxThemes` if the LLM returned more

### Error Handling
- Invalid JSON → Retry with: "Your previous response was not valid JSON. Return ONLY a JSON object."
- Empty themes → Return a single theme: "General Feedback"
- LLM timeout → Retry with exponential backoff

---

## Task 3.2 — Implement `src/process/quoteSelector.ts`

### Function Signature
```typescript
interface QuoteResult {
  quotes: Array<{
    text: string;      // Exact quote from a review
    theme: string;     // Which theme it represents
    rating: number;    // Rating of the source review
  }>;
  actions: Array<{
    title: string;
    description: string;
    theme: string;
  }>;
}

async function selectQuotesAndActions(
  reviews: Review[],
  themes: ThemeGroup[],
  apiKey: string
): Promise<QuoteResult>
```

### Quote Selection — LLM Prompt

**System prompt:**
```
You are a product analyst selecting representative user quotes from app reviews.
CRITICAL RULE: Every quote you select MUST be an exact substring copied
from the provided review text. Do not paraphrase, summarize, or modify quotes.
Return valid JSON only.
```

**User prompt:**
```
From the following app reviews grouped by theme, select:
1. Exactly 3 quotes — one from each of the top 3 themes
2. Each quote must be an EXACT substring from one of the provided reviews
3. Pick quotes that best represent the theme and are impactful

Also generate 3 action ideas:
1. One action per top theme
2. Each action should be concrete and implementable
3. Each action should be 1-2 sentences

Return JSON in this format:
{
  "quotes": [
    { "text": "exact quote here", "theme": "Theme Label", "rating": 2 }
  ],
  "actions": [
    { "title": "Short action title", "description": "1-2 sentence explanation", "theme": "Theme Label" }
  ]
}

TOP 3 THEMES AND THEIR REVIEWS:

THEME 1: {theme1.label} ({theme1.count} reviews, {theme1.sentiment})
{reviews for theme 1, numbered}

THEME 2: {theme2.label} ({theme2.count} reviews, {theme2.sentiment})
{reviews for theme 2, numbered}

THEME 3: {theme3.label} ({theme3.count} reviews, {theme3.sentiment})
{reviews for theme 3, numbered}
```

### Quote Grounding Validation (Critical)

After receiving quotes from the LLM, **validate** that each quote exists in the actual reviews:

```typescript
function validateQuoteGrounding(quote: string, reviews: Review[]): boolean {
  // Check if the quote is an exact substring of any review's text
  return reviews.some(r => r.text.includes(quote));
}
```

**If validation fails for a quote:**
1. Log a warning: `"⚠️ Quote not grounded: '{quote}'. Re-prompting..."`
2. Re-prompt the LLM with: `"The quote '{quote}' was not found in the reviews. Select a different quote that is an EXACT substring."`
3. If it fails after 3 retries, fall back to picking the first sentence of a review from that theme

### LLM Call Configuration

| Parameter | Value |
|-----------|-------|
| Model | `llama-3.1-70b-versatile` |
| Temperature | `0.3` |
| Max tokens | `1024` |
| JSON mode | `true` |

---

## Task 3.3 — Wire into `src/index.ts`

After the PII scrub stage:

```typescript
// Phase 3 — AI Analysis
console.log('\n🧠 Phase 3: AI Analysis');

const themes = await clusterThemes(scrubbed, config.maxThemes, config.groqApiKey);
console.log(`🏷️ Identified ${themes.length} themes`);
themes.forEach((t, i) => console.log(`   ${i+1}. ${t.label} (${t.count} reviews, ${t.sentiment})`));

const topThemes = themes.slice(0, 3);
const { quotes, actions } = await selectQuotesAndActions(scrubbed, topThemes, config.groqApiKey);
console.log(`💬 Selected ${quotes.length} grounded quotes`);
console.log(`💡 Generated ${actions.length} action ideas`);
```

---

## Acceptance Criteria

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| Themes generated | Pipeline output | 1–5 themes printed |
| Themes sorted by count | Check order | Highest count first |
| Exactly 3 quotes | Pipeline output | 3 quotes printed |
| Quotes are grounded | Each quote found in reviews.csv | Substring match passes |
| Exactly 3 actions | Pipeline output | 3 actions printed |
| Actions are actionable | Read them | Concrete, not vague |
| LLM errors handled | Temporarily use wrong API key | Error logged, not crash |
| JSON parsing works | Check theme/quote objects | Valid TypeScript objects |

### Expected Output
```
🧠 Phase 3: AI Analysis
🏷️ Identified 5 themes
   1. App Crashes & Performance (142 reviews, negative)
   2. KYC & Verification Issues (98 reviews, negative)
   3. Customer Support (87 reviews, negative)
   4. Investment Experience (64 reviews, positive)
   5. UI & Feature Requests (41 reviews, mixed)
💬 Selected 3 grounded quotes
💡 Generated 3 action ideas
```
