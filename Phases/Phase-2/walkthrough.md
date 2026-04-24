# Phase 2 Implementation Walkthrough

I have implemented the **Data Processing** layer (Phase 2), which transforms raw review data into a clean, unified, and privacy-compliant dataset.

## Work Completed

### 1. Normalization (`src/process/normalize.ts`)
- Created a mapper to convert inconsistent raw data from App Store and Play Store into a unified `Review` interface.
- Includes basic cleaning: trimming whitespace, clamping ratings to 1-5, and mapping source labels.

### 2. Date Filtering (`src/process/filterRecent.ts`)
- Implemented a filtering stage that limits reviews to the last 12 weeks (configurable).
- Added sorting logic to ensure the newest reviews appear first in the analysis.

### 3. PII Scrubbing (`src/process/piiScrub.ts`)
- Developed a high-performance regex-based scrubbing engine.
- Configured to detect and redact 6 types of sensitive information:
  - Emails
  - Indian and International Phone Numbers
  - Self-identification phrases (e.g., "my name is...")
  - Account/User IDs
  - UPI IDs
- Successfully redacted **24 instances** of PII in the current run.

### 4. CSV Export
- Integrated the processed output with the file utility to save the final dataset to `output/reviews.csv`.

## Verification Results

### Execution
The pipeline successfully processed the 500 reviews fetched in Phase 1:

```text
🚀 App Review Insights Analyser

✅ Config loaded for Groww
📊 Total raw reviews: 500
🔄 Normalized 500 reviews (0 App Store, 500 Play Store)
📅 Reviews in window: 500 / 500 (12 weeks)
🛡️ PII scrub: 24 redactions across 500 reviews
💾 Saved 500 clean reviews to output/reviews.csv
```

### Data Audit
- **`output/reviews.csv`**: Contains 500 rows with columns `source, rating, title, text, date, version`.
- **Privacy**: Spot-checked the CSV and confirmed that email addresses and phone numbers have been replaced with `[REDACTED]`.
- **Filtering**: Confirmed that all review dates are within the 12-week window.

## Snapshot Stored
A full runnable snapshot of this phase has been saved to:
`Phases/Phase-2/`

## Next Steps
With a clean, privacy-safe dataset ready, we can proceed to **Phase 3 — AI-Powered Analysis**.
