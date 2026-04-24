# Phase 0 — Evaluation Criteria

## Overview
Phase 0 sets up the project foundation. Evaluation focuses on ensuring all dependencies install correctly, configuration loads properly, and utility modules are functional.

---

## Evaluation Checklist

### E0.1 — Project Initialization
| # | Check | Command / Method | Pass Criteria |
|---|-------|-----------------|---------------|
| 1 | `package.json` exists and is valid | `cat package.json \| jq .` | Valid JSON, correct name and type |
| 2 | `"type": "module"` is set | Inspect package.json | ES modules enabled |
| 3 | `start` script defined | `npm run start` | Runs without "missing script" error |
| 4 | `typecheck` script defined | `npm run typecheck` | Runs tsc without errors |

### E0.2 — Dependencies
| # | Check | Command | Pass Criteria |
|---|-------|---------|---------------|
| 1 | All production deps installed | `npm ls --depth=0` | No missing dependencies |
| 2 | `app-store-scraper` importable | `node -e "require('app-store-scraper')"` | No error |
| 3 | `google-play-scraper` importable | `node -e "require('google-play-scraper')"` | No error |
| 4 | `groq-sdk` importable | `node -e "require('groq-sdk')"` | No error |
| 5 | `csv-stringify` importable | `node -e "require('csv-stringify')"` | No error |
| 6 | `csv-parse` importable | `node -e "require('csv-parse')"` | No error |
| 7 | `dotenv` importable | `node -e "require('dotenv')"` | No error |
| 8 | `date-fns` importable | `node -e "require('date-fns')"` | No error |
| 9 | `@modelcontextprotocol/sdk` importable | `node -e "require('@modelcontextprotocol/sdk')"` | No error |
| 10 | `googleapis` importable | `node -e "require('googleapis')"` | No error |
| 11 | Dev deps installed | `npm ls --dev --depth=0` | typescript, tsx, @types/node present |

### E0.3 — TypeScript Configuration
| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `tsconfig.json` exists | File check | Present in project root |
| 2 | Target is ES2022+ | Inspect tsconfig | `"target": "ES2022"` |
| 3 | Module is ESNext | Inspect tsconfig | `"module": "ESNext"` |
| 4 | Strict mode enabled | Inspect tsconfig | `"strict": true` |
| 5 | Type checking passes | `npm run typecheck` | Zero errors |

### E0.4 — Environment Configuration
| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `.env.example` exists | File check | Contains all required vars |
| 2 | `.env.example` has GROQ_API_KEY | Inspect file | `GROQ_API_KEY=your_...` |
| 3 | `.env.example` has PRODUCT_NAME | Inspect file | `PRODUCT_NAME=Groww` |
| 4 | `.env.example` has APP_STORE_ID | Inspect file | `APP_STORE_ID=1404684361` |
| 5 | `.env.example` has PLAY_STORE_PACKAGE | Inspect file | `PLAY_STORE_PACKAGE=com.nextbillion.groww` |
| 6 | `.env.example` has REVIEW_WINDOW_WEEKS | Inspect file | `REVIEW_WINDOW_WEEKS=12` |
| 7 | `.env.example` has MAX_THEMES | Inspect file | `MAX_THEMES=5` |
| 8 | `.env.example` has MCP vars | Inspect file | `GOOGLE_DOC_ID=`, `ENABLE_GMAIL_SEND=false`, `GMAIL_RECIPIENTS=` |
| 9 | `.gitignore` excludes `.env` | Inspect file | `.env` listed |
| 10 | `.gitignore` excludes `node_modules/` | Inspect file | `node_modules/` listed |
| 11 | `.gitignore` excludes `credentials.json` | Inspect file | `credentials.json` listed |
| 12 | `.gitignore` excludes `token.json` | Inspect file | `token.json` listed |

### E0.5 — Config Module (`src/config/products.ts`)
| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Exports `getConfig()` function | Import and call | Returns PipelineConfig object |
| 2 | Loads GROQ_API_KEY from .env | Set in .env, call getConfig | Value matches .env |
| 3 | Uses defaults when optional vars missing | Remove PRODUCT_NAME from .env | Returns "Groww" |
| 4 | Throws on missing GROQ_API_KEY | Remove from .env, run | Error with clear message |
| 5 | Returns correct types | TypeScript check | All fields match PipelineConfig |
| 6 | MCP fields have defaults | Omit MCP vars from .env | `enableGmailSend=false`, `gmailRecipients=[]`, paths default |
| 7 | Gmail validation works | Set `ENABLE_GMAIL_SEND=true` without recipients | Throws clear error |

### E0.6 — File Utility (`src/utils/file.ts`)
| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `ensureDir()` creates directory | Call with new path | Directory created |
| 2 | `ensureDir()` on existing dir | Call on existing path | No error |
| 3 | `writeMarkdown()` writes file | Call with test content | File created with content |
| 4 | `writeReviewsCSV()` writes CSV | Call with test Review[] | Valid CSV file created |
| 5 | `readCSV()` parses CSV | Write then read | Returns parsed rows |
| 6 | CSV escaping works | Include commas/quotes in data | Properly escaped in output |

### E0.7 — LLM Utility (`src/utils/llm.ts`)
| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `callLLM()` function exists | Import | No error |
| 2 | Valid API key → response | Call with simple prompt | Returns non-empty string |
| 3 | Invalid API key → error | Use wrong key | Throws with clear message |
| 4 | JSON mode returns parseable JSON | Set `jsonMode: true` | `JSON.parse()` succeeds |
| 5 | Temperature parameter works | Set to 0.0 | Deterministic-ish response |

### E0.8 — MCP Utility (`src/utils/mcp.ts`)
| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | `appendToGoogleDoc()` function exists | Import | No error |
| 2 | `sendGmail()` function exists | Import | No error |
| 3 | `getGoogleAuthClient()` function exists | Import | No error |
| 4 | Missing credentials → returns `{ success: false }` | Call without credentials.json | Does not throw, returns failure |
| 5 | Invalid doc ID → returns `{ success: false }` | Call with bogus ID | Does not throw, returns failure |

### E0.9 — Entry Point (`src/index.ts`)
| # | Check | Method | Pass Criteria |
|---|-------|--------|---------------|
| 1 | Runs without error | `npm run start` | Exit code 0 |
| 2 | Prints config confirmation | Check stdout | "Config loaded for Groww" |
| 3 | Prints directory readiness | Check stdout | "Directories ready" |
| 4 | Prints API key status | Check stdout | "Groq API key configured" |

---

## Scoring

| Category | Weight | Max Score |
|----------|--------|-----------|
| Project init & deps | 15% | 15 |
| TypeScript config | 10% | 10 |
| Environment setup | 15% | 15 |
| Config module | 15% | 15 |
| File utility | 15% | 15 |
| LLM utility | 10% | 10 |
| MCP utility | 10% | 10 |
| Entry point | 10% | 10 |
| **Total** | **100%** | **100** |

**Pass threshold: 85/100** (all critical checks must pass; non-critical like CLI polish can be partial)
