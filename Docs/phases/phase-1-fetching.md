# Phase 1 — Review Fetching

## Goal

Build the data ingestion layer that pulls public reviews from the Apple App Store and Google Play Store for the configured product (Groww). Include a CSV fallback path so the pipeline works even if the scraper libraries fail or are rate-limited.

## Prerequisites

- Phase 0 complete (project scaffolded, config loading, utilities ready)
- `app-store-scraper` and `google-play-scraper` installed
- `GROQ_API_KEY`, `APP_STORE_ID`, `PLAY_STORE_PACKAGE` set in `.env`

## Files to Create

| File | Purpose |
|------|---------|
| `src/fetch/appStore.ts` | Fetches reviews from the Apple App Store |
| `src/fetch/playStore.ts` | Fetches reviews from the Google Play Store |

## Files to Modify

| File | Change |
|------|--------|
| `src/index.ts` | Add fetch stage to pipeline, call both fetchers, handle fallback |

---

## Step-by-Step Tasks

### Task 1.1 — Understand the Raw Data Formats

Before writing code, understand what each scraper returns:

**App Store Scraper (`app-store-scraper`):**
```typescript
// Each review object from store.reviews() looks like:
{
  id: string;
  userName: string;        // ⚠️ DO NOT STORE — PII
  userUrl: string;         // ⚠️ DO NOT STORE — PII
  version: string;         // e.g. "5.2.1"
  score: number;           // 1–5
  title: string;           // Review title
  text: string;            // Review body
  url: string;
  updated: string;         // ISO date
}
```

**Play Store Scraper (`google-play-scraper`):**
```typescript
// Each review object from gplay.reviews() looks like:
{
  id: string;
  userName: string;        // ⚠️ DO NOT STORE — PII
  userImage: string;       // ⚠️ DO NOT STORE — PII
  score: number;           // 1–5
  title: string | null;    // Often null for Play Store
  text: string;            // Review body
  thumbsUp: number;
  version: string | null;  // May be null
  date: string;            // ISO date
  replyDate: string | null;
  replyText: string | null;
}
```

> **Critical PII Rule:** Never store `userName`, `userUrl`, `userImage`, `id` or any user-identifying field. Only extract: `score`, `title`, `text`, `date`, `version`.

### Task 1.2 — Implement `src/fetch/appStore.ts`

**Function signature:**
```typescript
interface RawAppStoreReview {
  score: number;
  title: string;
  text: string;
  updated: string;
  version: string;
}

async function fetchAppStoreReviews(appId: string): Promise<RawAppStoreReview[]>
```

**Implementation details:**

1. Import `app-store-scraper` (it's a CommonJS module, use `import store from 'app-store-scraper'`)
2. Use `store.reviews()` with these options:
   ```typescript
   {
     id: appId,         // numeric app ID as string
     sort: store.sort.RECENT,
     page: 1,           // start from page 1
     country: 'in'      // India (Groww is India-focused)
   }
   ```
3. **Pagination:** The scraper returns up to ~50 reviews per page. Loop through pages 1–10 (up to ~500 reviews) to get sufficient data. Stop early if a page returns 0 results.
4. **Extract only safe fields** from each review: `score`, `title`, `text`, `updated`, `version`
5. **Save raw data** to `data/raw/appstore-reviews.json` for debugging
6. **Error handling:** If the fetch fails (network error, rate limit), log the error and return an empty array. Don't crash the pipeline.
7. **Logging:** Print how many reviews were fetched: `"📱 Fetched {n} App Store reviews"`

### Task 1.3 — Implement `src/fetch/playStore.ts`

**Function signature:**
```typescript
interface RawPlayStoreReview {
  score: number;
  title: string | null;
  text: string;
  date: string;
  version: string | null;
}

async function fetchPlayStoreReviews(packageName: string): Promise<RawPlayStoreReview[]>
```

**Implementation details:**

1. Import `google-play-scraper` (CommonJS module: `import gplay from 'google-play-scraper'`)
2. Use `gplay.reviews()` with these options:
   ```typescript
   {
     appId: packageName,    // e.g. "com.nextbillion.groww"
     sort: gplay.sort.NEWEST,
     num: 500,              // request up to 500 reviews
     lang: 'en',            // English reviews
     country: 'in'          // India
   }
   ```
3. The Play Store scraper returns `{ data: Review[] }`. Access `.data` to get the array.
4. **Extract only safe fields**: `score`, `title` (or null), `text`, `date`, `version` (or null)
5. **Save raw data** to `data/raw/playstore-reviews.json`
6. **Error handling:** Same as App Store — log and return empty array on failure
7. **Logging:** Print `"🤖 Fetched {n} Play Store reviews"`

### Task 1.4 — Implement CSV Fallback Import

If both scrapers fail (return 0 reviews), the pipeline should fall back to reading CSV files from `data/raw/`.

**Logic (add to `src/index.ts` or a shared fetch utility):**

1. After both fetchers run, check: `if (appStoreReviews.length === 0 && playStoreReviews.length === 0)`
2. Look for CSV files in `data/raw/`:
   - `data/raw/appstore-reviews.csv`
   - `data/raw/playstore-reviews.csv`
3. Use the `readCSV()` function from `src/utils/file.ts` to parse them
4. Expected CSV columns: `source, rating, title, text, date, version`
5. Log: `"📂 Using CSV fallback: found {n} reviews from {filename}"`
6. If no CSV files exist either, throw an error: `"No reviews found. Place CSV files in data/raw/ or check network connection."`

**CSV fallback format (for manual data):**
```csv
source,rating,title,text,date,version
app_store,4,Great app,"Love the UI and investment options",2026-03-15,5.2.1
play_store,2,Crashes often,"App crashes when I try to check my portfolio",2026-03-10,5.1.8
```

### Task 1.5 — Wire Fetch Stage into `src/index.ts`

Update the pipeline entry point to:

1. Load config
2. Call `fetchAppStoreReviews(config.appStoreId)`
3. Call `fetchPlayStoreReviews(config.playStorePackage)`
4. If both return empty, try CSV fallback
5. Combine all raw reviews into a single array
6. Print total count: `"📊 Total raw reviews: {n}"`
7. Pass the combined array to the next stage (Phase 2 — but for now, just print and stop)

---

## Acceptance Criteria

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| App Store fetch works | `npm run start` | Prints "Fetched N App Store reviews" with N > 0 |
| Play Store fetch works | `npm run start` | Prints "Fetched N Play Store reviews" with N > 0 |
| Raw data saved | Check `data/raw/` | `appstore-reviews.json` and `playstore-reviews.json` exist |
| No PII in raw files | Search raw JSON for `userName` | Field not present in saved data |
| CSV fallback works | Delete raw JSON, place test CSV in `data/raw/` | Pipeline reads CSV and prints count |
| Error resilience | Disconnect network, run pipeline | Logs error, tries CSV fallback, doesn't crash |

### Quick Test

```bash
npm run start
```

**Expected output (happy path):**
```
✅ Config loaded for Groww
📱 Fetched 247 App Store reviews
🤖 Fetched 489 Play Store reviews
📊 Total raw reviews: 736
Pipeline paused after fetch stage. Proceed to Phase 2.
```

---

## Edge Cases to Handle

| Scenario | Behavior |
|----------|----------|
| App Store returns 0 reviews | Log warning, continue with Play Store only |
| Play Store returns 0 reviews | Log warning, continue with App Store only |
| Both return 0 + no CSVs in data/raw/ | Throw error with instructions |
| Network timeout | Catch error, log it, try CSV fallback |
| Scraper library API changes | Catch unexpected errors, log full error, try CSV fallback |
| Very few reviews (<10) | Log warning but proceed — Phase 2 filter might reduce further |
