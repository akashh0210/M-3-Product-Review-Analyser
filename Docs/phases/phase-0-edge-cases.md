# Phase 0 — Edge Cases

## Overview
Phase 0 edge cases focus on environment setup failures, dependency issues, and configuration validation. These are the "what can go wrong before the pipeline even runs" scenarios.

---

## Edge Case Matrix

### EC0.1 — Missing or Invalid `.env`

| # | Scenario | Input | Expected Behavior | Severity |
|---|----------|-------|--------------------|----------|
| 1 | `.env` file does not exist | No .env file | `dotenv` loads nothing; `getConfig()` throws "GROQ_API_KEY is required. Create a .env file from .env.example" | 🔴 Critical |
| 2 | `.env` exists but is empty | Empty file | Same as above — throw on missing GROQ_API_KEY | 🔴 Critical |
| 3 | GROQ_API_KEY is empty string | `GROQ_API_KEY=` | Treat as missing — throw error | 🔴 Critical |
| 4 | GROQ_API_KEY has extra whitespace | `GROQ_API_KEY= gsk_abc... ` | Trim whitespace before using | 🟡 Medium |
| 5 | PRODUCT_NAME is missing | Not in .env | Use default "Groww" | 🟢 Low |
| 6 | REVIEW_WINDOW_WEEKS is not a number | `REVIEW_WINDOW_WEEKS=abc` | Use default 12, log warning | 🟡 Medium |
| 7 | REVIEW_WINDOW_WEEKS is negative | `REVIEW_WINDOW_WEEKS=-5` | Use default 12, log warning | 🟡 Medium |
| 8 | REVIEW_WINDOW_WEEKS is 0 | `REVIEW_WINDOW_WEEKS=0` | Use default 12, log warning | 🟡 Medium |
| 9 | MAX_THEMES is 0 | `MAX_THEMES=0` | Use default 5, log warning | 🟡 Medium |
| 10 | MAX_THEMES is > 10 | `MAX_THEMES=50` | Clamp to 10, log warning | 🟢 Low |

### EC0.2 — Dependency Issues

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | `node_modules/` deleted after install | `rm -rf node_modules` | `npm run start` fails with clear error; fix: `npm install` | 🔴 Critical |
| 2 | Wrong Node.js version (<18) | Use Node 16 | May work but features might break; log Node version at startup | 🟡 Medium |
| 3 | Package lock conflicts | Corrupt `package-lock.json` | Delete lock file, reinstall | 🟡 Medium |
| 4 | `app-store-scraper` deprecated | Library removed from npm | Pipeline should catch import error, suggest CSV fallback | 🟡 Medium |

### EC0.3 — File System Issues

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | `output/` directory doesn't exist | First run | `ensureDir()` creates it | 🟢 Low |
| 2 | `data/raw/` directory doesn't exist | First run | `ensureDir()` creates it | 🟢 Low |
| 3 | No write permission on output/ | OS permission issue | Catch EACCES error, log clear message | 🔴 Critical |
| 4 | Disk full | No space left | Catch ENOSPC error, log clear message | 🔴 Critical |
| 5 | File path has special chars | Unicode in path | Use `path.resolve()` to handle | 🟡 Medium |
| 6 | `writeReviewsCSV` with empty array | `[]` input | Write CSV header only, no data rows | 🟢 Low |
| 7 | `readCSV` with non-CSV file | Pass a .json file | Return parse error, don't crash | 🟡 Medium |

### EC0.4 — LLM Utility Edge Cases

| # | Scenario | Trigger | Expected Behavior | Severity |
|---|----------|---------|--------------------| ---------|
| 1 | Invalid GROQ_API_KEY format | `GROQ_API_KEY=not-a-real-key` | Groq SDK throws auth error; catch and show "Invalid API key" | 🔴 Critical |
| 2 | Groq API is down | Service outage | Timeout after 30s, throw with "Groq API unreachable" | 🔴 Critical |
| 3 | Network disconnected | No internet | Timeout, clear error message | 🔴 Critical |
| 4 | Empty system prompt | `systemPrompt: ""` | Use a default system prompt | 🟡 Medium |
| 5 | Empty user prompt | `userPrompt: ""` | Throw — can't make an LLM call with no question | 🔴 Critical |
| 6 | Very long prompt (>32K tokens) | Huge review set | Should be caught before calling; if not, Groq returns error | 🟡 Medium |
| 7 | `maxTokens` set to 0 | Misconfiguration | Use default 2048 | 🟢 Low |
| 8 | `temperature` > 2.0 | Misconfiguration | Clamp to 2.0 | 🟢 Low |

---

## Test Scripts

### Test 1: Missing API Key
```bash
# Temporarily remove GROQ_API_KEY
$env:GROQ_API_KEY=""
npx tsx src/index.ts
# Expected: Error message about missing API key
```

### Test 2: File Utility
```typescript
// Quick test script — save as src/test-file-utils.ts
import { ensureDir, writeMarkdown, writeReviewsCSV, readCSV } from './utils/file.js';

// Test ensureDir
await ensureDir('output');
await ensureDir('output'); // should not error on second call

// Test writeMarkdown
await writeMarkdown('# Test', 'output/test.md');

// Test CSV round-trip
const testReviews = [{
  source: 'app_store' as const,
  rating: 4,
  title: 'Test review with "quotes" and, commas',
  text: 'This is a test review',
  date: '2026-03-15',
  version: '5.0.0'
}];
await writeReviewsCSV(testReviews, 'output/test.csv');
const parsed = await readCSV('output/test.csv');
console.log('Round-trip test:', parsed[0].title === testReviews[0].title ? '✅ PASS' : '❌ FAIL');
```

### Test 3: LLM Connectivity
```typescript
// Quick test — save as src/test-llm.ts
import { getConfig } from './config/products.js';
import { callLLM } from './utils/llm.js';

const config = getConfig();
const response = await callLLM(config.groqApiKey, {
  systemPrompt: 'You are a test assistant.',
  userPrompt: 'Reply with exactly: "LLM connection successful"',
  maxTokens: 50
});
console.log(response.includes('successful') ? '✅ LLM test PASS' : '❌ LLM test FAIL');
```
