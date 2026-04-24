# Phase 0 — Project Scaffolding

## Goal

Set up the project foundation: initialize npm, install all dependencies, configure TypeScript, create the directory structure, and build the utility modules that every other phase depends on.

## Prerequisites

- Node.js 18+ installed
- npm available
- A Groq API key (get one free at https://console.groq.com)

## Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Project metadata, scripts, dependencies |
| `tsconfig.json` | TypeScript compiler configuration |
| `.env.example` | Template showing required environment variables |
| `.env` | Actual environment variables (gitignored) |
| `.gitignore` | Files excluded from version control |
| `src/config/products.ts` | Product registry — app IDs and package names |
| `src/utils/file.ts` | CSV writer and Markdown writer helpers |
| `src/utils/llm.ts` | Groq LLM client abstraction |
| `src/utils/mcp.ts` | MCP client for optional Google Docs + Gmail push |
| `src/index.ts` | Placeholder pipeline entry point |

## Directories to Create

```
src/
├── config/
├── fetch/
├── process/
├── generate/
└── utils/
    ├── file.ts
    ├── llm.ts
    └── mcp.ts
data/
└── raw/
output/
```

---

## Step-by-Step Tasks

### Task 0.1 — Initialize npm Project

```bash
npm init -y
```

Then update `package.json` to set:
- `"name": "app-review-insights-analyser"`
- `"type": "module"` (for ES module imports)
- `"scripts"`:
  ```json
  {
    "start": "npx tsx src/index.ts",
    "typecheck": "npx tsc --noEmit"
  }
  ```

### Task 0.2 — Install Dependencies

**Production:**
```bash
npm install app-store-scraper google-play-scraper groq-sdk csv-stringify csv-parse dotenv date-fns @modelcontextprotocol/sdk googleapis
```

**Dev:**
```bash
npm install -D typescript tsx @types/node
```

### Task 0.3 — Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "data", "output"]
}
```

### Task 0.4 — Create `.env.example`

```env
# LLM Configuration
GROQ_API_KEY=your_groq_api_key_here

# Product Configuration
PRODUCT_NAME=Groww
APP_STORE_ID=1404684361
PLAY_STORE_PACKAGE=com.nextbillion.groww

# Pipeline Configuration
REVIEW_WINDOW_WEEKS=12
MAX_THEMES=5

# Optional MCP Integration (Google Docs + Gmail)
# Leave blank to skip MCP push entirely
GOOGLE_DOC_ID=
ENABLE_GMAIL_SEND=false
GMAIL_RECIPIENTS=
GOOGLE_CREDENTIALS_PATH=./credentials.json
GOOGLE_TOKEN_PATH=./token.json
```

### Task 0.5 — Create `.env`

Copy `.env.example` to `.env` and fill in your actual `GROQ_API_KEY`. All other values can stay at defaults.

### Task 0.6 — Create `.gitignore`

```
node_modules/
dist/
.env
data/raw/
output/
*.log
credentials.json
token.json
```

### Task 0.7 — Create Directory Structure

```bash
mkdir -p src/config src/fetch src/process src/generate src/utils data/raw output
```

(On Windows PowerShell, use `New-Item -ItemType Directory -Force` for each path.)

### Task 0.8 — Create `src/config/products.ts`

This module loads environment variables and exports the pipeline configuration.

**What it should do:**
1. Call `dotenv.config()` to load `.env`
2. Export a `getConfig()` function that returns:

```typescript
interface PipelineConfig {
  productName: string;       // from PRODUCT_NAME env var, default "Groww"
  appStoreId: string;        // from APP_STORE_ID env var, default "1404684361"
  playStorePackage: string;  // from PLAY_STORE_PACKAGE env var, default "com.nextbillion.groww"
  reviewWindowWeeks: number; // from REVIEW_WINDOW_WEEKS env var, default 12
  maxThemes: number;         // from MAX_THEMES env var, default 5
  groqApiKey: string;        // from GROQ_API_KEY env var, throws if missing

  // Optional MCP Integration
  googleDocId?: string;           // from GOOGLE_DOC_ID env var (undefined = skip)
  enableGmailSend: boolean;       // from ENABLE_GMAIL_SEND env var, default false
  gmailRecipients: string[];      // from GMAIL_RECIPIENTS env var, comma-split, default []
  googleCredentialsPath: string;  // from GOOGLE_CREDENTIALS_PATH env var, default "./credentials.json"
  googleTokenPath: string;        // from GOOGLE_TOKEN_PATH env var, default "./token.json"
}
```

**Validation:**
- If `GROQ_API_KEY` is missing or empty, throw an error with a clear message telling the user to set it in `.env`.
- If `ENABLE_GMAIL_SEND=true` but `GMAIL_RECIPIENTS` is empty, throw an error: "GMAIL_RECIPIENTS is required when ENABLE_GMAIL_SEND is true."
- MCP fields are all optional — pipeline works fully without them.

### Task 0.9 — Create `src/utils/file.ts`

File I/O helper functions.

**Functions to implement:**

```typescript
// Write an array of Review objects to a CSV file
// Columns: source, rating, title, text, date, version
// Use csv-stringify to handle proper CSV escaping
async function writeReviewsCSV(reviews: Review[], filePath: string): Promise<void>

// Write a string to a markdown file
async function writeMarkdown(content: string, filePath: string): Promise<void>

// Read a CSV file and return parsed rows
// Use csv-parse to handle CSV parsing
async function readCSV(filePath: string): Promise<Record<string, string>[]>

// Ensure a directory exists, creating it if necessary
async function ensureDir(dirPath: string): Promise<void>
```

**Import notes:**
- Use `fs/promises` for all file operations
- Use `path` module for path resolution
- Use `csv-stringify/sync` for CSV generation
- Use `csv-parse/sync` for CSV parsing

### Task 0.10 — Create `src/utils/llm.ts`

Groq LLM client abstraction.

**What it should do:**
1. Import `Groq` from `groq-sdk`
2. Accept the API key from config
3. Expose a single function:

```typescript
interface LLMCallOptions {
  model?: string;          // default: "llama-3.1-70b-versatile"
  systemPrompt: string;    // System message setting the LLM's role
  userPrompt: string;      // The actual task/question
  temperature?: number;    // default: 0.3 (low for factual tasks)
  maxTokens?: number;      // default: 2048
  jsonMode?: boolean;      // if true, set response_format to json_object
}

async function callLLM(apiKey: string, options: LLMCallOptions): Promise<string>
```

**Error handling:**
- Wrap the Groq call in a try-catch
- On rate limit error (status 429), wait 2 seconds and retry (max 3 retries)
- On any other error, log it and throw
- Log the model used, token usage (from response), and response time

### Task 0.11 — Create `src/utils/mcp.ts`

MCP client for optional Google Docs and Gmail integration.

**What it should do:**
1. Import `Client` from `@modelcontextprotocol/sdk/client/index.js`
2. Import `google` from `googleapis` (used as fallback)
3. Expose two functions and one helper:

```typescript
// Authenticate with Google OAuth 2.0
// Reads credentials.json, checks for cached token.json
// If no token.json, logs a URL for the user to visit and waits for the auth code
// Returns an authenticated OAuth2 client
async function getGoogleAuthClient(
  credentialsPath: string,
  tokenPath: string
): Promise<OAuth2Client>

// Append the weekly note markdown content to a Google Doc
// Inserts a horizontal rule + date header + content at the end of the document
// Returns success status and character count of inserted text
async function appendToGoogleDoc(
  docId: string,
  content: string,
  credentialsPath: string,
  tokenPath: string
): Promise<{ success: boolean; insertedTextLength: number }>

// Send an email via Gmail API
// Converts the markdown email draft to a simple HTML email
// Returns success status and the Gmail message ID
async function sendGmail(
  to: string[],
  subject: string,
  body: string,
  credentialsPath: string,
  tokenPath: string
): Promise<{ success: boolean; messageId?: string }>
```

**Implementation approach:**
1. First attempt to connect to an MCP server (if one is running) exposing `google-docs` and `gmail` tools using `@modelcontextprotocol/sdk`.
2. If MCP server connection fails (timeout after 5s), fall back to direct `googleapis` calls.
3. Both paths use the same `getGoogleAuthClient()` for authentication.
4. Log which path was used: `"🔌 MCP server connected"` or `"🔌 Using googleapis fallback"`.

**Error handling:**
- Wrap all calls in try-catch
- On auth failure, log: `"❌ Google auth failed. Run the pipeline once to complete OAuth setup."`
- On API error, log the error but **never crash the pipeline** — Stage 6 failures are non-fatal
- Return `{ success: false }` on any failure

### Task 0.12 — Create `src/index.ts` (Placeholder)

A minimal entry point that validates the setup works:

```typescript
// 1. Import getConfig from config/products
// 2. Call getConfig() to validate env vars load correctly
// 3. Print: "✅ Config loaded for {productName}"
// 4. Print: "📁 Directories ready"
// 5. Print: "🔑 Groq API key configured"
// 6. Print: "Pipeline not yet implemented. Proceed to Phase 1."
```

---

## Acceptance Criteria

After completing Phase 0, verify:

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| Project initializes | `npm install` runs without errors | All deps installed |
| TypeScript works | `npm run typecheck` | No type errors |
| Config loads | `npm run start` | Prints "Config loaded for Groww" |
| API key validated | Run without GROQ_API_KEY in .env | Throws clear error |
| Directories exist | Check `src/`, `data/raw/`, `output/` | All present |
| File util works | Import and call `ensureDir` | No errors |

### Quick Test Command

```bash
npm run start
```

**Expected output:**
```
✅ Config loaded for Groww
📁 Directories ready
🔑 Groq API key configured
Pipeline not yet implemented. Proceed to Phase 1.
```
