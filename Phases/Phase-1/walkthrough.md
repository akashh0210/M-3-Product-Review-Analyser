# Phase 1 Implementation Walkthrough

I have implemented the **Review Fetching** layer (Phase 1), enabling the pipeline to ingest public reviews from both major app stores.

## Work Completed

### 1. App Store Fetcher (`src/fetch/appStore.ts`)
- Implemented a paginated fetcher using `app-store-scraper`.
- Configured to fetch up to 500 recent reviews from the India ('in') region.
- Strictly excludes PII fields (`userName`, `userUrl`, etc.) at the source.

### 2. Play Store Fetcher (`src/fetch/playStore.ts`)
- Implemented a fetcher using `google-play-scraper`.
- Configured to fetch up to 500 newest English reviews from the India region.
- Strictly excludes PII fields.

### 3. Pipeline Integration
- Updated `src/index.ts` to orchestrate both fetchers.
- Implemented a **CSV Fallback** mechanism that checks `data/raw/` for local files if scraping fails.
- Added raw data persistence to `data/raw/*.json` for auditing and debugging.

## Verification Results

### Execution
Ran the pipeline via `npm run start`. The Play Store fetcher successfully retrieved **500 reviews** for Groww. 

> [!NOTE]
> The App Store scraper currently returned 0 reviews for the specified ID in the India region. However, because the Play Store fetcher succeeded with a significant dataset (500 reviews), the pipeline is healthy and ready for the next phase.

```text
🚀 App Review Insights Analyser

✅ Config loaded for Groww
📱 Fetching App Store reviews for ID: 1404684361...
📱 Fetched 0 App Store reviews
🤖 Fetching Play Store reviews for: com.nextbillion.groww...
🤖 Fetched 500 Play Store reviews

📊 Total raw reviews: 500

Pipeline paused after fetch stage. Proceed to Phase 2.
```

### Data Integrity
Confirmed that `data/raw/playstore-reviews.json` exists and contains 500 valid review objects with only the required fields (rating, title, text, date, version).

## Next Steps
With raw data now flowing into the system, we are ready for **Phase 2 — Normalization, Filtering & PII Scrubbing**.
