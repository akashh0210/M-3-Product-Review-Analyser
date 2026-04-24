# App Review Insights Analyser — System Architecture

## 1. Overview

The App Review Insights Analyser is a **CLI-first, AI-powered pipeline** that ingests public app reviews, processes them through a series of modular stages, and outputs a stakeholder-ready weekly pulse. The system is designed to be **repeatable** — running it again with fresh data produces a new weekly report with zero code changes.

### Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **LLM Provider** | Groq (Llama 3.1 8B / 70B) | Free tier, fast inference (~500 tokens/sec), no heavyweight SDK |
| **Target Product** | Groww | Popular Indian fintech app with high review volume on both stores |
| **Review Import** | Public scraper libraries (primary) + CSV fallback | Scraper gives fresh data; CSV fallback ensures the pipeline works even if scrapers break |
| **Execution** | Single CLI command (`npx tsx src/index.ts`) | No build step, no server, easy to demo |
| **MCP Integration** | Optional Google Docs + Gmail via `@modelcontextprotocol/sdk` | Append weekly note to a shared doc and optionally send email directly |

---

## 2. Data Flow Architecture

The pipeline moves data through **5 core stages** in a strict linear sequence, with an **optional 6th stage** for MCP-based external push. Each stage reads from the previous stage's output and writes to disk before proceeding.

```
┌───────────────────────────────────────────────────────────────────┐
│                        INPUT SOURCES                              │
│                                                                   │
│   ┌──────────────────┐          ┌──────────────────┐              │
│   │  Apple App Store  │          │  Google Play Store│              │
│   │  (app ID: 1404684361)│       │  (pkg: com.nextbillion.groww)│  │
│   └────────┬─────────┘          └────────┬─────────┘              │
│            │                              │                        │
│            │    ┌──────────────────┐      │                        │
│            └───►│  CSV Fallback    │◄─────┘                        │
│                 │  (data/raw/*.csv)│                                │
│                 └────────┬─────────┘                               │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 1 — FETCH                                                 │
│  Pull raw reviews from both stores. Save to data/raw/ as JSON.   │
│  Output: RawReview[] (App Store format + Play Store format)       │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2 — NORMALIZE                                             │
│  Map both formats into a single unified Review interface.        │
│  Handle missing fields (Play Store titles often empty).          │
│  Output: Review[]                                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 3 — FILTER + SCRUB                                        │
│  a) Filter to reviews within the configured date window          │
│     (default: last 12 weeks from today)                          │
│  b) Run PII scrubber to redact emails, phone numbers, names,    │
│     account IDs from review text                                 │
│  Output: Review[] (cleaned) → saved as output/reviews.csv       │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 4 — AI ANALYSIS                                           │
│  a) Theme Clustering: Send review texts to Groq LLM.            │
│     Group into ≤5 themes. Get label, count, sentiment.           │
│  b) Quote Selection: From top 3 themes, extract 3 exact quotes  │
│     that exist verbatim in the reviews. Validate grounding.      │
│  c) Action Ideas: Generate 3 actionable recommendations.        │
│  Output: WeeklyPulse object (themes + quotes + actions)         │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 5 — GENERATE OUTPUTS                                      │
│  a) Weekly Note: ≤250 word markdown summary                      │
│     → saved as output/weekly-note.md                             │
│  b) Email Draft: Professional email wrapping the weekly note     │
│     → saved as output/email-draft.md                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 6 — OPTIONAL MCP PUSH                                     │
│  a) Google Docs: Append weekly note to configured document       │
│     → Requires GOOGLE_DOC_ID in .env                           │
│  b) Gmail: Send email draft to configured recipients             │
│     → Requires ENABLE_GMAIL_SEND=true in .env                  │
│  Output: Updated Google Doc, sent email (both optional)          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
app-review-insights-analyser/
├── README.md                          # Project overview, rerun steps, theme legend
├── Docs/
│   ├── problemstatement.md            # Challenge problem statement
│   ├── architecture.md                # This file — system architecture
│   └── phases/                        # Phase-wise implementation guides
│       ├── phase-0-scaffolding.md
│       ├── phase-1-fetching.md
│       ├── phase-2-processing.md
│       ├── phase-3-analysis.md
│       ├── phase-4-generation.md
│       └── phase-5-testing.md
│
├── package.json                       # Dependencies and npm scripts
├── tsconfig.json                      # TypeScript compiler configuration
├── .env.example                       # Environment variable template
├── .env                               # Actual env vars (gitignored)
├── .gitignore                         # Files to exclude from git
│
├── src/
│   ├── index.ts                       # CLI entry — orchestrates the full pipeline
│   │
│   ├── config/
│   │   └── products.ts                # Product registry (app IDs, package names, env loading)
│   │
│   ├── fetch/
│   │   ├── appStore.ts                # Fetches reviews from Apple App Store
│   │   └── playStore.ts               # Fetches reviews from Google Play Store
│   │
│   ├── process/
│   │   ├── normalize.ts               # Maps raw store data → unified Review interface
│   │   ├── filterRecent.ts            # Filters reviews to the configured date window
│   │   ├── piiScrub.ts                # Detects and redacts PII from review text
│   │   ├── themeCluster.ts            # LLM-based theme grouping (≤5 themes)
│   │   └── quoteSelector.ts           # LLM-based grounded quote + action extraction
│   │
│   ├── generate/
│   │   ├── weeklyNote.ts              # Generates the ≤250 word weekly note (markdown)
│   │   └── emailDraft.ts              # Formats the weekly note as a stakeholder email
│   │
│   └── utils/
│       ├── file.ts                    # File I/O helpers (write CSV, write Markdown)
│       ├── llm.ts                     # Groq LLM client abstraction
│       └── mcp.ts                     # MCP client for Google Docs + Gmail (optional)
│
├── data/
│   └── raw/                           # Raw fetched JSON or fallback CSVs (gitignored)
│
└── output/                            # Generated deliverables
    ├── reviews.csv                    # Normalized + filtered + scrubbed reviews
    ├── weekly-note.md                 # One-page weekly pulse
    └── email-draft.md                 # Stakeholder email draft
```

---

## 4. Core Data Models

### 4.1 Review (Unified)

Every review from both stores is mapped to this single interface before any processing:

```typescript
interface Review {
  source: "app_store" | "play_store";  // Which store it came from
  rating: number;                       // 1–5 star rating
  title: string;                        // Review title (may be "" for Play Store)
  text: string;                         // Full review body text
  date: string;                         // ISO 8601 date string (e.g. "2026-03-15")
  version: string;                      // App version at review time (or "unknown")
}
```

**PII rule:** No fields for username, email, user ID, or device ID are ever stored. The `piiScrub` module additionally scans the `text` and `title` fields to redact PII that users type into their reviews.

### 4.2 ThemeGroup

Output of the theme clustering stage:

```typescript
interface ThemeGroup {
  label: string;          // e.g. "App Crashes & Performance"
  count: number;          // Number of reviews assigned to this theme
  sentiment: "positive" | "negative" | "mixed";
  summary: string;        // 1-2 sentence summary of the theme
  reviewIndices: number[]; // Indices into the filtered Review[] array
}
```

### 4.3 WeeklyPulse

The final structured analysis result, used by the generation stage:

```typescript
interface WeeklyPulse {
  product: string;                      // "Groww"
  dateRange: { from: string; to: string }; // ISO date strings
  totalReviews: number;
  avgRating: number;                    // Average star rating across all reviews
  themes: ThemeGroup[];                 // All themes (≤5), sorted by count desc
  topThemes: ThemeGroup[];              // Top 3 themes
  quotes: Array<{                      // 3 grounded quotes
    text: string;                       // Exact quote from a real review
    theme: string;                      // Which theme this quote represents
    rating: number;                     // Rating of the review the quote comes from
  }>;
  actions: Array<{                     // 3 action ideas
    title: string;                      // Short action title
    description: string;                // 1-2 sentence explanation
    theme: string;                      // Which theme this action addresses
  }>;
}
```

---

## 5. Tech Stack

### Runtime & Language
- **Node.js 18+** — LTS runtime
- **TypeScript** — Type safety for all data models
- **tsx** — Zero-config TypeScript execution (no separate build step)

### Dependencies (Production)

| Package | Version | Purpose |
|---------|---------|---------|
| `app-store-scraper` | latest | Fetch public App Store reviews without authentication |
| `google-play-scraper` | latest | Fetch public Play Store reviews without authentication |
| `groq-sdk` | latest | Official Groq client for LLM calls |
| `csv-stringify` | latest | Write Review[] to CSV format |
| `csv-parse` | latest | Read fallback CSV files from data/raw/ |
| `dotenv` | latest | Load .env variables |
| `date-fns` | latest | Date arithmetic (subWeeks, isAfter, format) |
| `@modelcontextprotocol/sdk` | latest | MCP client for Google Docs / Gmail integration |
| `googleapis` | latest | Google OAuth + API calls (fallback if MCP unavailable) |

### Dependencies (Dev)

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.x | TypeScript compiler (for type checking only) |
| `tsx` | latest | Run .ts files directly |
| `@types/node` | latest | Node.js type definitions |

---

## 6. LLM Strategy

### 7.1 LLM Strategy

- **Model Selection:**
  - **Analysis Stage (Phases 3.1 & 3.2):** `llama-3.1-8b-instant` — Optimized for high throughput and token efficiency during batch processing of 500+ reviews.
  - **Generation Stage (Phase 4.1):** `llama-3.3-70b-versatile` — High-reasoning model for professional report drafting and word-count constrained writing.
- **JSON Mode:** Strictly enforced for all analysis stages.
- **Temperature:** 0.2 for analysis (deterministic) and 0.4 for generation (fluent).
- **Word Count Enforcement:** Automated via retry-loop in the generation stage.
- **PII Scrubbing:** Regex-based pre-processing before data reaches the LLM.

### 7.2 Validation Framework

The project includes an automated validation suite (`src/validate.ts`) that performs:
1. **Schema Check:** Ensures CSV and Markdown files match expected structures.
2. **Word Count Check:** Strictly enforces the ≤250 word limit for the weekly note.
3. **Grounding Check:** Verifies that AI-selected quotes exist in the raw data.
4. **Privacy Check:** Final pass to ensure no PII escaped earlier redaction stages.
- **Context window:** 8K tokens (8B) or 32K tokens (70B)

### LLM Call Points

The pipeline makes **4 LLM calls** in a single run:

| Call | Stage | Input | Output | Model |
|------|-------|-------|--------|-------|
| 1 | Theme clustering | All review texts (batched if >100) | ≤5 ThemeGroup objects | 70B (needs reasoning) |
| 2 | Quote selection | Top 3 themes + their review texts | 3 exact quotes | 70B (needs precision) |
| 3 | Action generation | Top 3 themes + summaries | 3 action ideas | 8B (creative task) |
| 4 | Weekly note | Full WeeklyPulse data | ≤250 word markdown note | 70B (writing quality) |

### Error Handling
- **Invalid JSON from LLM:** Retry up to 3 times with a stricter "return only valid JSON" prompt
- **Rate limit hit:** Wait and retry with exponential backoff (1s, 2s, 4s)
- **Empty response:** Log error, skip to next stage with a fallback message

### Abstraction

All LLM calls go through `src/utils/llm.ts`, which exposes a single function:

```typescript
async function callLLM(options: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;     // default 0.3
  maxTokens?: number;       // default 1024
  responseFormat?: "json" | "text";
}): Promise<string>
```

Swapping providers (to OpenAI, Anthropic, etc.) requires changing only this file.

---

## 7. Pipeline Orchestration

`src/index.ts` runs the pipeline as a sequential chain:

```
1. Load config (product, env vars)
2. FETCH
   ├── Fetch App Store reviews OR skip on error
   ├── Fetch Play Store reviews OR skip on error
   └── If both fail, try CSV fallback from data/raw/
3. NORMALIZE
   └── Map all raw reviews → Review[]
4. FILTER
   └── Keep only reviews within date window → Review[]
5. PII SCRUB
   ├── Scan and redact PII in text + title fields
   └── Write output/reviews.csv
6. THEME CLUSTERING (LLM)
   └── Group reviews into ≤5 ThemeGroup[]
7. QUOTE SELECTION (LLM)
   ├── Select 3 grounded quotes from top 3 themes
   └── Generate 3 action ideas
8. GENERATE WEEKLY NOTE (LLM)
   └── Write output/weekly-note.md
9. GENERATE EMAIL DRAFT
   └── Write output/email-draft.md
10. OPTIONAL MCP PUSH
    ├── If GOOGLE_DOC_ID is set → append weekly note to Google Doc
    └── If ENABLE_GMAIL_SEND=true → send email draft via Gmail
11. DONE — Print summary
```

Each stage logs:
- Stage name
- Input count (e.g., "Processing 342 reviews")
- Output count or result summary
- Duration

---

## 8. Phases Overview

The implementation is split into **6 phases**, each documented in its own file under `Docs/phases/`:

| Phase | Document | What It Covers |
|-------|----------|----------------|
| **0** | [phase-0-scaffolding.md](phases/phase-0-scaffolding.md) | Project init, dependencies, config, utilities, directory structure |
| **1** | [phase-1-fetching.md](phases/phase-1-fetching.md) | App Store + Play Store fetchers, CSV fallback, raw data storage |
| **2** | [phase-2-processing.md](phases/phase-2-processing.md) | Normalize, date filter, PII scrub, reviews.csv output |
| **3** | [phase-3-analysis.md](phases/phase-3-analysis.md) | LLM theme clustering, grounded quote selection, action ideas |
| **4** | [phase-4-generation.md](phases/phase-4-generation.md) | Weekly note (≤250 words), email draft, optional MCP push (Google Docs + Gmail), full pipeline wiring |
| **5** | [phase-5-testing.md](phases/phase-5-testing.md) | Output validation, MCP connectivity checks, edge cases, CLI polish, demo prep |

Each phase document contains:
- **Goal** — What this phase achieves
- **Prerequisites** — What must be done before starting
- **Files to create/modify** — Exact file paths and purposes
- **Detailed specifications** — Interfaces, function signatures, logic
- **Step-by-step tasks** — Numbered implementation steps
- **Acceptance criteria** — How to verify the phase is complete

---

## 9. MCP Integration (Optional)

The pipeline supports an **optional Stage 6** that pushes the generated outputs to external systems via MCP (Model Context Protocol) servers for Google Docs and Gmail. This stage is **skipped entirely** if the required environment variables are absent, keeping the core pipeline lightweight and auth-free.

### 9.1 Architecture Decision

| Decision | Choice | Why |
|----------|--------|-----|
| **MCP vs direct REST** | MCP primary, `googleapis` fallback | MCP is the user-requested protocol; `googleapis` is a fallback if MCP server is unavailable |
| **Auth model** | Google OAuth 2.0 (Desktop app) | Standard Google API auth; one-time setup, token refresh handled by client |
| **When it runs** | Only if env vars present | Keeps core pipeline zero-auth by default |
| **Failure behavior** | Log warning, do not crash pipeline | Stage 6 failures must never block local file generation |

### 9.2 Env-Driven Activation

| Variable | Required? | Effect |
|----------|-----------|--------|
| `GOOGLE_DOC_ID` | Yes (for Docs push) | Appends weekly note to the specified Google Doc |
| `ENABLE_GMAIL_SEND` | Yes (for email send) | Must be `"true"` to trigger Gmail send |
| `GMAIL_RECIPIENTS` | Yes (if email enabled) | Comma-separated list of recipient addresses |
| `GOOGLE_CREDENTIALS_PATH` | No | Path to `credentials.json` (default: `./credentials.json`) |
| `GOOGLE_TOKEN_PATH` | No | Path to cached `token.json` (default: `./token.json`) |

### 9.3 MCP Client Module (`src/utils/mcp.ts`)

Exposes two functions:

```typescript
async function appendToGoogleDoc(
  docId: string,
  content: string,
  credentialsPath?: string
): Promise<{ success: boolean; insertedTextLength: number }>

async function sendGmail(
  to: string[],
  subject: string,
  bodyHtml: string,
  credentialsPath?: string
): Promise<{ success: boolean; messageId?: string }>
```

**Implementation approach:**
1. Attempt to connect to an MCP server exposing `google-docs` and `gmail` tools.
2. If MCP server is unavailable, fall back to `googleapis` REST client using OAuth tokens.
3. Both paths share the same OAuth token storage (`token.json`).

### 9.4 Security & Privacy

- **PII scrub happens before Stage 6.** The weekly note and email draft sent to Google already have `[REDACTED]` placeholders.
- **No review-level data** is ever pushed to external systems — only the summary note and email draft.
- **`credentials.json` and `token.json` are gitignored by default.**
- **Tokens are refreshed automatically** via the Google OAuth client; no manual re-auth on every run.
