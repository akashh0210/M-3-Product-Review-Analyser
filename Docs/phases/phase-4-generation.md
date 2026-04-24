# Phase 4 — Weekly Note & Email Draft Generation

## Goal

Generate the two final deliverable files:
1. `output/weekly-note.md` — A concise weekly pulse (≤250 words) with top themes, quotes, and actions
2. `output/email-draft.md` — A professional email wrapping the weekly note for stakeholders

Optionally, push outputs to external systems via MCP:
3. Append weekly note to a Google Doc (if `GOOGLE_DOC_ID` is configured)
4. Send email draft via Gmail (if `ENABLE_GMAIL_SEND=true`)

Also wire the complete pipeline end-to-end in `src/index.ts`.

## Prerequisites

- Phase 3 complete (themes, quotes, and actions available as structured data)
- `src/utils/llm.ts`, `src/utils/file.ts`, and `src/utils/mcp.ts` working
- For MCP push: Google OAuth `credentials.json` in project root (see Architecture §9)

## Files to Create

| File | Purpose |
|------|---------|
| `src/generate/weeklyNote.ts` | Generates the ≤250 word weekly note as markdown |
| `src/generate/emailDraft.ts` | Formats the weekly note as a professional email |

## Files to Modify

| File | Change |
|------|--------|
| `src/index.ts` | Wire the full pipeline end-to-end |

---

## Task 4.1 — Implement `src/generate/weeklyNote.ts`

### Function Signature
```typescript
interface WeeklyNoteInput {
  product: string;
  dateRange: { from: string; to: string };
  totalReviews: number;
  avgRating: number;
  topThemes: ThemeGroup[];
  quotes: Array<{ text: string; theme: string; rating: number }>;
  actions: Array<{ title: string; description: string; theme: string }>;
}

async function generateWeeklyNote(
  input: WeeklyNoteInput,
  apiKey: string
): Promise<string>  // Returns markdown string
```

### LLM Prompt Design

**System prompt:**
```
You are a product analyst writing a weekly app review pulse for stakeholders.
Write in a clear, professional, scannable style.
The note MUST be 250 words or fewer.
Use markdown formatting.
Do not invent any information — use only the data provided.
```

**User prompt:**
```
Write a weekly app review pulse for {product} using the data below.
The note must be ≤250 words, formatted in markdown.

DATA:
- Period: {from} to {to}
- Total reviews analyzed: {totalReviews}
- Average rating: {avgRating}/5

TOP 3 THEMES:
1. {theme1.label} — {theme1.count} reviews, {theme1.sentiment}
   Summary: {theme1.summary}
2. {theme2.label} — {theme2.count} reviews, {theme2.sentiment}
   Summary: {theme2.summary}
3. {theme3.label} — {theme3.count} reviews, {theme3.sentiment}
   Summary: {theme3.summary}

SELECTED QUOTES (use these exact quotes):
1. "{quote1.text}" — ★{quote1.rating}
2. "{quote2.text}" — ★{quote2.rating}
3. "{quote3.text}" — ★{quote3.rating}

ACTION IDEAS:
1. {action1.title}: {action1.description}
2. {action2.title}: {action2.description}
3. {action3.title}: {action3.description}

FORMAT the note using this structure:
# Weekly App Review Pulse — {product}
**Period:** ... | **Reviews:** ... | **Avg Rating:** ...

## Top Themes
(numbered list with count and sentiment)

## What Users Are Saying
(3 blockquotes)

## Recommended Actions
(numbered list)
```

### Word Count Enforcement

After receiving the LLM response:

```typescript
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

let note = await callLLM(...);
let wordCount = countWords(note);

if (wordCount > 250) {
  // Re-prompt with stricter instruction
  note = await callLLM({
    ...options,
    userPrompt: `The note you wrote is ${wordCount} words. Rewrite it to be UNDER 250 words while keeping all key information. Here is the note:\n\n${note}`
  });
  wordCount = countWords(note);
}

console.log(`📝 Weekly note: ${wordCount} words`);
```

If still over 250 after retry, log a warning but proceed.

### Write to File
```typescript
await writeMarkdown(note, 'output/weekly-note.md');
```

### LLM Call Configuration

| Parameter | Value |
|-----------|-------|
| Model | `llama-3.1-70b-versatile` |
| Temperature | `0.4` (slightly creative for writing) |
| Max tokens | `1024` |
| JSON mode | `false` (we want markdown text) |

---

## Task 4.2 — Implement `src/generate/emailDraft.ts`

### Function Signature
```typescript
async function generateEmailDraft(
  weeklyNote: string,
  product: string,
  dateRange: { from: string; to: string },
  author: string
): Promise<string>  // Returns markdown-formatted email
```

### Email Template (No LLM Needed)

The email draft can be generated with a simple template — no LLM call required:

```typescript
function generateEmailDraft(weeklyNote, product, dateRange, author) {
  return `# Email Draft

**To:** Product Team, Growth Team, Support Team, Leadership
**From:** ${author}
**Subject:** Weekly App Review Pulse — ${product} (${dateRange.from} to ${dateRange.to})

---

Hi team,

Please find below this week's app review pulse for **${product}**, summarizing user feedback from the App Store and Google Play.

${weeklyNote}

---

If any of these themes need deeper investigation or if you'd like to discuss priorities, let's connect this week.

Best regards,
${author}

---

*This pulse was generated using the App Review Insights Analyser. Data sourced from public App Store and Google Play reviews.*
`;
}
```

### Write to File
```typescript
await writeMarkdown(emailDraft, 'output/email-draft.md');
```

---

## Task 4.3 — Wire the Complete Pipeline in `src/index.ts`

The final orchestrator should run all stages in sequence:

```typescript
async function main() {
  console.log('🚀 App Review Insights Analyser\n');

  // 1. Config
  const config = getConfig();
  console.log(`✅ Config loaded for ${config.productName}`);

  // 2. Fetch
  const appStoreRaw = await fetchAppStoreReviews(config.appStoreId);
  const playStoreRaw = await fetchPlayStoreReviews(config.playStorePackage);
  // + CSV fallback if both empty

  // 3. Normalize
  const normalized = normalizeAll(appStoreRaw, playStoreRaw);

  // 4. Filter
  const filtered = filterRecentReviews(normalized, config.reviewWindowWeeks);

  // 5. PII Scrub + CSV export
  const { reviews, redactionCount } = scrubPII(filtered);
  await writeReviewsCSV(reviews, 'output/reviews.csv');

  // 6. Theme Clustering
  const themes = await clusterThemes(reviews, config.maxThemes, config.groqApiKey);

  // 7. Quote + Action Selection
  const topThemes = themes.slice(0, 3);
  const { quotes, actions } = await selectQuotesAndActions(reviews, topThemes, config.groqApiKey);

  // 8. Calculate metadata
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const dates = reviews.map(r => r.date).sort();
  const dateRange = { from: dates[0], to: dates[dates.length - 1] };

  // 9. Weekly Note
  const note = await generateWeeklyNote({
    product: config.productName,
    dateRange,
    totalReviews: reviews.length,
    avgRating: Math.round(avgRating * 10) / 10,
    topThemes,
    quotes,
    actions
  }, config.groqApiKey);

  // 10. Email Draft
  const email = generateEmailDraft(note, config.productName, dateRange, 'Sk Akash Ali');
  await writeMarkdown(email, 'output/email-draft.md');

  // 11. Optional MCP Push (Stage 6)
  await mcpPush(config, note, email, dateRange);

  // 12. Summary
  console.log('\n✅ Pipeline complete!');
  console.log('📁 Output files:');
  console.log('   - output/reviews.csv');
  console.log('   - output/weekly-note.md');
  console.log('   - output/email-draft.md');
}

main().catch(console.error);
```

### Add Timing

Wrap the pipeline in a timer:
```typescript
const startTime = Date.now();
// ... pipeline ...
const duration = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`⏱️ Total time: ${duration}s`);
```

---

## Task 4.4 — Optional MCP Push (Stage 6)

Create a helper function in `src/index.ts` (or a separate `src/generate/mcpPush.ts`) that conditionally pushes outputs to Google Docs and Gmail.

```typescript
import { appendToGoogleDoc, sendGmail } from '../utils/mcp.js';

async function mcpPush(
  config: PipelineConfig,
  weeklyNote: string,
  emailDraft: string,
  dateRange: { from: string; to: string }
): Promise<void> {
  const mcpEnabled = config.googleDocId || config.enableGmailSend;
  if (!mcpEnabled) {
    console.log('\n⏩ MCP push skipped (not configured)');
    return;
  }

  console.log('\n🔌 Stage 6: MCP Push');

  // Google Docs
  if (config.googleDocId) {
    try {
      const result = await appendToGoogleDoc(
        config.googleDocId,
        weeklyNote,
        config.googleCredentialsPath,
        config.googleTokenPath
      );
      if (result.success) {
        console.log(`📑 Appended ${result.insertedTextLength} chars to Google Doc`);
      } else {
        console.log('⚠️ Google Docs push failed (see log above)');
      }
    } catch (err) {
      console.error(`⚠️ Google Docs push error: ${(err as Error).message}`);
    }
  }

  // Gmail
  if (config.enableGmailSend) {
    try {
      const subject = `Weekly App Review Pulse — ${config.productName} (${dateRange.from} to ${dateRange.to})`;
      const result = await sendGmail(
        config.gmailRecipients,
        subject,
        emailDraft,
        config.googleCredentialsPath,
        config.googleTokenPath
      );
      if (result.success) {
        console.log(`📧 Email sent (ID: ${result.messageId})`);
      } else {
        console.log('⚠️ Gmail send failed (see log above)');
      }
    } catch (err) {
      console.error(`⚠️ Gmail send error: ${(err as Error).message}`);
    }
  }
}
```

**Key rules:**
- **Never crash the pipeline.** All MCP errors are caught and logged as warnings.
- **Local files are always generated first.** MCP push is the last step.
- If neither `GOOGLE_DOC_ID` nor `ENABLE_GMAIL_SEND` is configured, print a skip message and return.

---

## Acceptance Criteria

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| Weekly note exists | Check `output/weekly-note.md` | File exists with content |
| Word count ≤ 250 | Count words in note | ≤ 250 |
| Contains 3 themes | Read the note | 3 themes listed |
| Contains 3 quotes | Read the note | 3 blockquotes |
| Contains 3 actions | Read the note | 3 action items |
| Quotes match CSV | Cross-reference with reviews.csv | Exact match found |
| Email draft exists | Check `output/email-draft.md` | File exists with content |
| Email has subject line | Read email | Subject line present |
| Email has greeting/closing | Read email | Professional format |
| Full pipeline runs | `npm run start` | All stages complete |
| MCP skip (no config) | Run without GOOGLE_DOC_ID or ENABLE_GMAIL_SEND | "MCP push skipped" printed, no error |
| Google Doc append | Set GOOGLE_DOC_ID, run pipeline | Note appended to doc, char count logged |
| Gmail send | Set ENABLE_GMAIL_SEND=true + GMAIL_RECIPIENTS | Email sent, message ID logged |
| MCP failure non-fatal | Set invalid GOOGLE_DOC_ID | Warning logged, pipeline still reports success |

### Expected Final Output (with MCP enabled)
```
🚀 App Review Insights Analyser

✅ Config loaded for Groww
📱 Fetched 247 App Store reviews
🤖 Fetched 489 Play Store reviews
📊 Total raw reviews: 736
🔄 Normalized 730 reviews
📅 Reviews in window: 612 / 730 (12 weeks)
🛡️ PII scrub: 14 redactions
💾 Saved 612 reviews to output/reviews.csv
🧠 Identified 5 themes
💬 Selected 3 grounded quotes
💡 Generated 3 action ideas
📝 Weekly note: 238 words
📧 Email draft generated

🔌 Stage 6: MCP Push
📑 Appended 1247 chars to Google Doc
📧 Email sent (ID: 18f3a7b2c4d5e6f7)

✅ Pipeline complete!
📁 Output files:
   - output/reviews.csv
   - output/weekly-note.md
   - output/email-draft.md
⏱️ Total time: 15.1s
```

### Expected Final Output (without MCP)
```
...(same as above up to email draft)...

⏩ MCP push skipped (not configured)

✅ Pipeline complete!
📁 Output files:
   - output/reviews.csv
   - output/weekly-note.md
   - output/email-draft.md
⏱️ Total time: 12.3s
```
