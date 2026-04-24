# Phase 5 — Testing, Validation & Demo Prep

## Goal

Validate that all pipeline outputs meet the problem statement requirements, handle edge cases gracefully, and prepare the project for submission and demo recording.

## Prerequisites

- Phase 4 complete (full pipeline runs end-to-end, all 3 output files generated)

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/validate.ts` (NEW) | Output validation script — checks all quality constraints |
| `src/index.ts` (MODIFY) | Add validation step at the end of the pipeline |
| `README.md` (MODIFY) | Final polish — ensure rerun steps and theme legend are complete |

---

## Task 5.1 — Build Output Validation Script

Create `src/validate.ts` with automated checks:

### Function Signature
```typescript
interface ValidationResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    details: string;
  }>;
}

async function validateOutputs(reviews: Review[], weeklyNote: string): Promise<ValidationResult>
```

### Validation Checks

#### Check 1 — Word Count (≤250)
```typescript
const wordCount = weeklyNote.split(/\s+/).filter(w => w.length > 0).length;
const passed = wordCount <= 250;
// Details: "Weekly note is {wordCount} words (limit: 250)"
```

#### Check 2 — Theme Count (exactly 3 in note)
```typescript
// Count lines matching "1.", "2.", "3." pattern under "## Top Themes"
// Should find exactly 3 themes
```

#### Check 3 — Quote Grounding
```typescript
// Extract blockquotes from the weekly note (lines starting with >)
// For each quote, verify it exists as a substring in at least one review.text
for (const quote of extractedQuotes) {
  const cleaned = quote.replace(/^>\s*"?|"?\s*$/g, '');
  const grounded = reviews.some(r => r.text.includes(cleaned));
  // Log: "Quote grounded: {yes/no} — '{first 50 chars}...'"
}
```

#### Check 4 — PII Absence in All Outputs
```typescript
// Read all 3 output files
// Run PII regex patterns against their content
const piiPatterns = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,  // email
  /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g,              // phone
  // ... other patterns from Phase 2
];
// Should find 0 matches
```

#### Check 5 — CSV Integrity
```typescript
// Parse output/reviews.csv with csv-parse
// Verify: no parse errors, correct column count, all ratings 1-5
// Verify: all dates within configured window
```

#### Check 6 — Output Files Exist
```typescript
// Check that all 3 files exist and are non-empty:
// - output/reviews.csv
// - output/weekly-note.md
// - output/email-draft.md
```

### Validation Output Format
```
📋 VALIDATION RESULTS
═══════════════════════════════════════
✅ Word count: 238/250 words
✅ Theme count: 3 themes found
✅ Quote 1 grounded: "App crashes every time I..."
✅ Quote 2 grounded: "KYC verification took two..."
✅ Quote 3 grounded: "Customer support never resp..."
✅ PII check: 0 PII patterns found in outputs
✅ CSV integrity: 612 valid rows, correct columns
✅ All output files exist and are non-empty
═══════════════════════════════════════
RESULT: 8/8 checks passed ✅
```

---

## Task 5.2 — Edge Case Handling

Ensure the pipeline handles these scenarios without crashing:

| Scenario | Expected Behavior | How to Test |
|----------|-------------------|-------------|
| **No reviews fetched** | Try CSV fallback → clear error if no CSV | Disconnect network, remove CSVs |
| **Very few reviews (<10)** | Warn, proceed with fewer themes | Place a CSV with 5 reviews in data/raw/ |
| **All reviews are old** | Empty after filter → error with suggestion to increase window | Set REVIEW_WINDOW_WEEKS=1 |
| **LLM returns invalid JSON** | Retry up to 3x → fallback to generic theme | Temporarily corrupt API key (wrong model name) |
| **LLM fabricates quotes** | Grounding check catches it → re-prompt | Check logs for "Quote not grounded" warnings |
| **Reviews all same rating** | Pipeline still works, sentiment reflects it | Use test data with all 5★ reviews |
| **Very long reviews** | Truncate to first 500 chars when sending to LLM | Test with a review >2000 chars |
| **Unicode/emoji in reviews** | Handle gracefully, don't break CSV | Reviews with 🔥😡 etc. |
| **Missing .env file** | Clear error message telling user what to do | Delete .env, run pipeline |
| **MCP: No credentials.json** | Stage 6 logs warning, pipeline succeeds | Set GOOGLE_DOC_ID without credentials.json |
| **MCP: Invalid doc ID** | Stage 6 logs "Google Docs push failed", pipeline succeeds | Set GOOGLE_DOC_ID=invalid_id |
| **MCP: OAuth token expired** | Auto-refresh token; if refresh fails, log warning | Delete token.json, set valid credentials |
| **MCP: Gmail with no recipients** | Config validation throws before pipeline runs | Set ENABLE_GMAIL_SEND=true, leave GMAIL_RECIPIENTS empty |

### Implementation

Add error boundaries around each pipeline stage:

```typescript
try {
  // Stage N
} catch (error) {
  console.error(`❌ Stage N failed: ${error.message}`);
  if (canContinue) {
    console.log('⚠️ Continuing with partial data...');
  } else {
    console.error('🛑 Cannot continue. Fix the issue and rerun.');
    process.exit(1);
  }
}
```

---

## Task 5.3 — MCP Integration Validation

Add MCP-specific checks to `src/validate.ts`:

#### Check 7 — MCP Config Consistency
```typescript
// If GOOGLE_DOC_ID is set, verify credentials.json exists
// If ENABLE_GMAIL_SEND=true, verify GMAIL_RECIPIENTS is non-empty
// If neither is set, log "MCP not configured — skipping MCP checks"
```

#### Check 8 — Google Doc Append (Optional)
```typescript
// Only run if GOOGLE_DOC_ID is configured
// Verify the doc was updated after the pipeline ran (check last modified time)
// This is a soft check — warn but don’t fail validation if MCP was skipped
```

#### Check 9 — Gmail Send (Optional)
```typescript
// Only run if ENABLE_GMAIL_SEND=true
// Verify the pipeline logged a message ID
// This is a soft check based on console output inspection
```

### Updated Validation Output Format
```
📋 VALIDATION RESULTS
═══════════════════════════════════════
✅ Word count: 238/250 words
✅ Theme count: 3 themes found
✅ Quote 1 grounded: "App crashes every time I..."
✅ Quote 2 grounded: "KYC verification took two..."
✅ Quote 3 grounded: "Customer support never resp..."
✅ PII check: 0 PII patterns found in outputs
✅ CSV integrity: 612 valid rows, correct columns
✅ All output files exist and are non-empty
ℹ️ MCP: Google Doc push was configured — doc update confirmed
ℹ️ MCP: Gmail send was configured — message ID logged
═══════════════════════════════════════
RESULT: 8/8 core checks passed ✅ (2 MCP checks informational)
```

---

## Task 5.4 — CLI Polish

### Add CLI Arguments (Optional Enhancement)

Using `process.argv` parsing (no external library needed):

```typescript
const args = process.argv.slice(2);

// --product=Groww (override PRODUCT_NAME)
// --weeks=8 (override REVIEW_WINDOW_WEEKS)
// --dry-run (skip LLM calls, use mock data)
// --validate-only (only run validation on existing outputs)
// --help (print usage)
```

### Help Output
```
Usage: npx tsx src/index.ts [options]

Options:
  --product=NAME     Product to analyze (default: from .env)
  --weeks=N          Review window in weeks (default: 12)
  --dry-run          Skip LLM calls, use mock analysis
  --validate-only    Validate existing output files only
  --help             Show this help message
```

### Console Formatting

Add color and formatting to console output:
```typescript
// Simple ANSI color helpers (no dependency needed)
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
```

---

## Task 5.5 — Final README Polish

Ensure `README.md` has:

1. **Rerun steps** — Clear instructions for running with a new product/week
2. **Theme legend** — List of possible theme categories with descriptions
3. **Setup instructions** — Step-by-step from clone to first run
4. **Output examples** — What the generated files look like
5. **Author** — Sk Akash Ali
6. **MCP Setup (Optional)** — A dedicated section explaining:
   - How to create a Google Cloud project and enable Docs + Gmail APIs
   - How to generate OAuth 2.0 credentials (Desktop app type)
   - Where to place `credentials.json`
   - How the first-run auth flow works (URL + paste code)
   - Which env vars to set (`GOOGLE_DOC_ID`, `ENABLE_GMAIL_SEND`, `GMAIL_RECIPIENTS`)
   - That MCP is fully optional and the pipeline works without it

---

## Task 5.6 — Demo Prep Checklist

If recording a demo video (up to 3 minutes), prepare:

| Item | Prep Step |
|------|-----------|
| **Clean state** | Delete `output/` contents, ensure fresh run |
| **Terminal visible** | Use a clean terminal with readable font size |
| **Show the command** | `npm run start` — visible on screen |
| **Show pipeline progress** | Console output scrolling through stages |
| **Show reviews.csv** | Open in VS Code or Excel — show columns, PII redaction |
| **Show weekly-note.md** | Open and scroll through — highlight themes, quotes, actions |
| **Show email-draft.md** | Open and show the email format |
| **Show rerun** | Change `REVIEW_WINDOW_WEEKS=8` in .env, rerun, show different output |
| **Show MCP push** | If configured, show Google Doc updating and Gmail send confirmation |

### Demo Script (3 minutes)

```
0:00 - 0:15  "This is the App Review Insights Analyser for Groww"
0:15 - 0:30  Show .env config and explain product selection
0:30 - 1:00  Run `npm run start`, show pipeline stages executing
1:00 - 1:30  Open output/reviews.csv — show clean data, PII redacted
1:30 - 2:00  Open output/weekly-note.md — walk through themes, quotes, actions
2:00 - 2:20  Open output/email-draft.md — show stakeholder-ready email
2:20 - 2:40  Show MCP push: Google Doc updated, Gmail sent (if configured)
2:40 - 3:00  Show rerun capability (change a config, run again)
```

---

## Final Acceptance Criteria (Entire Project)

| Deliverable | Requirement | Status Check |
|-------------|-------------|--------------|
| Working prototype | `npm run start` produces all outputs | Run and verify |
| Weekly note | ≤250 words, 3 themes, 3 quotes, 3 actions | Validation script |
| Email draft | Professional format with subject line | Visual check |
| Reviews CSV | Normalized, filtered, PII-free | Validation script |
| README | Rerun steps + theme legend | Read through |
| Quotes grounded | Every quote from real review text | Validation script |
| No PII | Zero PII in any output file | Validation script |
| Repeatable | Rerun with different config works | Test with different week window |
| MCP (optional) | Google Doc appended + Gmail sent (if configured) | Set env vars, run, check doc/email |

### Final Run Checklist
```bash
# 1. Clean outputs
rm -rf output/*

# 2. Run pipeline
npm run start

# 3. Check all files exist
ls output/

# 4. Run validation
npx tsx src/validate.ts

# 5. Manual review
# - Open weekly-note.md and read it
# - Open email-draft.md and read it
# - Spot-check 5 rows in reviews.csv

# 6. (Optional) Verify MCP push
# - Open the Google Doc and check the note was appended
# - Check Gmail sent folder for the email
```
