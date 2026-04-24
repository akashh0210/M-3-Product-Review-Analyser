# Phase 2 — Normalization, Filtering & PII Scrubbing

## Goal

Take raw reviews from Phase 1 (two different formats) and run them through three processing steps:
1. **Normalize** — Map both formats into the unified `Review` interface
2. **Filter** — Keep only reviews from the last N weeks (default 12)
3. **PII Scrub** — Detect and redact personally identifiable information

Output: `output/reviews.csv`

## Prerequisites

- Phase 0 and Phase 1 complete
- Raw reviews available (from fetchers or CSV fallback)

## Files to Create

| File | Purpose |
|------|---------|
| `src/process/normalize.ts` | Maps raw data → unified Review[] |
| `src/process/filterRecent.ts` | Filters to configured date window |
| `src/process/piiScrub.ts` | Detects and redacts PII |

## Files to Modify

| File | Change |
|------|--------|
| `src/index.ts` | Add normalize → filter → scrub → CSV export stages |

---

## Task 2.1 — Implement `src/process/normalize.ts`

**Function signatures:**
```typescript
function normalizeAppStoreReviews(raw: RawAppStoreReview[]): Review[]
function normalizePlayStoreReviews(raw: RawPlayStoreReview[]): Review[]
function normalizeAll(appStore: RawAppStoreReview[], playStore: RawPlayStoreReview[]): Review[]
```

**Field mapping — App Store:**

| Raw Field | → Review Field | Notes |
|-----------|---------------|-------|
| `score` | `rating` | Direct 1–5 |
| `title` | `title` | Direct copy |
| `text` | `text` | Direct copy |
| `updated` | `date` | Format as YYYY-MM-DD |
| `version` | `version` | Default `"unknown"` if missing |
| — | `source` | Set to `"app_store"` |

**Field mapping — Play Store:**

| Raw Field | → Review Field | Notes |
|-----------|---------------|-------|
| `score` | `rating` | Direct 1–5 |
| `title` | `title` | Use `""` if null |
| `text` | `text` | Direct copy |
| `date` | `date` | Format as YYYY-MM-DD |
| `version` | `version` | Use `"unknown"` if null |
| — | `source` | Set to `"play_store"` |

**Edge cases:**
- Empty/whitespace-only `text` → skip the review
- Invalid date → skip, log warning
- Rating outside 1–5 → clamp to range

---

## Task 2.2 — Implement `src/process/filterRecent.ts`

**Function:**
```typescript
function filterRecentReviews(reviews: Review[], windowWeeks: number): Review[]
```

**Logic:**
```typescript
import { subWeeks, isAfter, parseISO } from 'date-fns';
const cutoff = subWeeks(new Date(), windowWeeks);
return reviews.filter(r => isAfter(parseISO(r.date), cutoff))
              .sort((a, b) => b.date.localeCompare(a.date)); // newest first
```

**Logging:** Print date window and count before/after filtering.

---

## Task 2.3 — Implement `src/process/piiScrub.ts`

**Function:**
```typescript
interface ScrubResult {
  reviews: Review[];
  redactionCount: number;
}
function scrubPII(reviews: Review[]): ScrubResult
```

**PII patterns (apply in this order):**

| Type | Regex | Example |
|------|-------|---------|
| Email | `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g` | `user@gmail.com` |
| Phone (IN) | `/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g` | `+91 98765 43210` |
| Phone (Intl) | `/(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g` | `+1-555-1234` |
| Self-ID | `/(?:my name is\|i am\|i'm)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/gi` | `my name is Rahul` |
| Account ref | `/(?:account\|user\|id\|ref)[\s:#]*[A-Z0-9]{6,}/gi` | `account #ABC123` |
| UPI ID | `/[a-zA-Z0-9.]+@[a-zA-Z]{2,}/g` | `user@paytm` |

Replace all matches with `[REDACTED]`. Run on both `text` and `title` fields.

---

## Task 2.4 — Write CSV Output

After processing, write clean reviews to `output/reviews.csv`:
- Columns: `source, rating, title, text, date, version`
- Use `writeReviewsCSV()` from `src/utils/file.ts`

---

## Task 2.5 — Wire into `src/index.ts`

```typescript
const normalized = normalizeAll(appStoreRaw, playStoreRaw);
const filtered = filterRecentReviews(normalized, config.reviewWindowWeeks);
const { reviews: scrubbed, redactionCount } = scrubPII(filtered);
await writeReviewsCSV(scrubbed, 'output/reviews.csv');
```

---

## Acceptance Criteria

| Check | Expected Result |
|-------|-----------------|
| Both store formats normalized | Unified Review[] array |
| Empty-text reviews excluded | Not in output |
| All CSV dates within window | ≥ cutoff date |
| PII emails redacted | `[REDACTED]` in CSV |
| PII phones redacted | `[REDACTED]` in CSV |
| CSV is valid/parseable | Opens in Excel correctly |
| Columns correct | `source,rating,title,text,date,version` |

### Expected Output
```
🔄 Normalized 730 reviews
📅 Reviews in window: 612 / 730 (12 weeks)
🛡️ PII scrub: 14 redactions across 612 reviews
💾 Saved 612 reviews to output/reviews.csv
```
