# App Review Insights Analyser

An AI-powered workflow that converts recent public App Store and Google Play reviews into a concise weekly product pulse for Product, Growth, Support, and Leadership teams. The project ingests reviews from the last 8–12 weeks, groups feedback into themes, extracts grounded user quotes, generates action ideas, and drafts a stakeholder-ready weekly note and email summary.

## Challenge Context

This project is built for the **PM Fellowship Learn in Public Challenge** based on the **App Review Insights Analyser** problem statement. The goal is to transform recent public app-store reviews for one selected product into a one-page weekly pulse containing:
- Top themes
- Real user quotes
- Three action ideas
- A draft email containing the weekly note

## Problem Statement

Product, Growth, Support, and Leadership teams often struggle to consistently learn from public app reviews because feedback is spread across the App Store and Google Play, arrives in high volume, and is difficult to manually scan every week. Recurring bugs, feature gaps, support pain points, and experience issues can be missed or recognized too late to influence product and support decisions effectively.

This project builds a lightweight, repeatable AI-powered workflow that imports reviews from the last 8–12 weeks, captures core fields such as rating, title, review text, and date, groups feedback into a maximum of 5 meaningful themes, and generates a stakeholder-friendly weekly note containing the top 3 themes, 3 grounded user quotes, and 3 action ideas. The workflow also drafts an email containing this weekly note so that the insights are ready to share in a familiar stakeholder format.

## Who This Helps

- **Product / Growth Teams:** Understand what to fix or prioritize next based on recurring feedback
- **Support Teams:** Spot repeating complaints and friction points
- **Leadership:** Get a fast weekly health snapshot tied to customer voice

## What This Project Does

The workflow:
1. Imports recent public reviews from the App Store and Google Play for one selected product
2. Normalizes review fields such as rating, title, text, and date
3. Filters reviews to the last 8–12 weeks
4. Groups feedback into a maximum of 5 themes
5. Selects the top 3 themes, 3 real user quotes, and 3 action ideas
6. Generates a one-page weekly note of 250 words or less
7. Drafts an email version of the weekly pulse
8. Optionally pushes outputs to external systems (Google Docs & Gmail) via MCP servers

## Scope

### In Scope
- Public App Store and Google Play reviews only
- One selected product in the first version
- Reviews from the last 8–12 weeks
- Review fields including rating, title, text, and date
- Grouping feedback into 5 themes maximum
- Weekly one-page note with top 3 themes, 3 user quotes, and 3 action ideas
- Draft email containing the weekly note
- Reviews CSV, latest weekly note, and README as submission artifacts

### Out of Scope
- Reviews from private dashboards, internal databases, or logged-in systems
- Social media, Reddit, X/Twitter, support tickets, or non-store feedback sources
- Real-time analytics dashboards or broad BI reporting
- Production-grade email delivery and enterprise workflow orchestration in version 1

## Key Constraints

- Use **public review exports only**; no scraping behind logins
- Keep themes to **5 maximum**
- Keep the weekly note **scannable and ≤250 words**
- Do **not** include usernames, emails, IDs, or other PII in any artifact
- Ensure selected quotes are grounded in actual review text

## Success Criteria

The project will be considered successful if it can:
- Import and normalize recent App Store and Google Play reviews for one chosen product
- Group review feedback into clear themes with a maximum of 5 categories
- Produce a one-page weekly note highlighting the top 3 themes, 3 real quotes, and 3 action ideas
- Draft a stakeholder-ready email based on the weekly note
- Generate submission-ready artifacts including the weekly note, reviews CSV, and README with rerun steps and theme legend
- Be rerun for a future week or product with minimal code changes and without rebuilding the workflow from scratch

## Project Structure

```text
app-review-insights-analyser/
├── README.md
├── PROBLEM_STATEMENT.md
├── package.json
├── .env.example
├── credentials.json (Required for MCP)
├── src/
│   ├── index.ts
│   ├── config/
│   │   └── products.ts
│   ├── fetch/
│   │   ├── appStore.ts
│   │   └── playStore.ts
│   ├── process/
│   │   ├── normalize.ts
│   │   ├── filterRecent.ts
│   │   ├── themeCluster.ts
│   │   ├── quoteSelector.ts
│   │   └── piiScrub.ts
│   ├── generate/
│   │   ├── weeklyNote.ts
│   │   └── emailDraft.ts
│   └── utils/
│       ├── file.ts
│       ├── llm.ts
│       └── mcp.ts
├── data/
│   ├── raw/
│   └── processed/
└── output/
    ├── reviews.csv
    ├── weekly-note.md
    └── email-draft.md
```

## Suggested Tech Stack

- **Runtime:** Node.js + TypeScript
- **Package manager:** npm or pnpm
- **LLM provider:** any provider you are comfortable using locally
- **Data format:** CSV + Markdown
- **Execution style:** CLI-first local workflow

A CLI-first setup keeps the prototype simple, repeatable, and easy to demo, which is a good fit for an automation-heavy challenge submission.

## Setup

### Prerequisites

- Node.js 18+
- npm / pnpm
- API key for your preferred LLM provider
- Public review data source for App Store and Google Play

### Installation

```bash
git clone <your-repo-url>
cd app-review-insights-analyser
npm install
```

### Environment Variables

Create a `.env` file using `.env.example`.

```env
GROQ_API_KEY=your_api_key_here
PRODUCT_NAME=Groww
REVIEW_WINDOW_WEEKS=12
MAX_THEMES=5

# Optional MCP (Google Docs + Gmail)
GOOGLE_DOC_ID=your_doc_id
ENABLE_GMAIL_SEND=false
GMAIL_RECIPIENTS=team@example.com
```

## How to Run

### 1. Fetch or place raw review data

Place raw review exports in the `data/raw/` folder, or use your fetch scripts to pull public reviews for the selected product.

### 2. Run the pipeline

```bash
npm run start
```

Or, if using a direct TypeScript runner:

```bash
npx tsx src/index.ts
```

### 3. Check outputs

Generated files will be available in the `output/` folder:
- `reviews.csv` — Normalized review data (with PII redaction if needed)
- `weekly-note.md` — One-page weekly pulse
- `email-draft.md` — Stakeholder email draft

## Example Flow

A typical run should:
- Import recent reviews
- Clean and normalize them
- Filter them to the last 8–12 weeks
- Group them into themes
- Select representative quotes
- Generate action ideas
- Write a final weekly note and email draft
- Optionally push to Google Docs/Gmail via MCP

## Theme Legend

Themes are the high-level buckets used to organize user feedback. In this project, theme labels are generated from grouped review content and may include categories such as:
- App performance & bugs
- Customer support friction
- Onboarding / KYC issues
- Payments / withdrawals
- UX & feature gaps

The system should output **no more than 5 themes** in a given run, and highlight the top 3 in the final note.

## Rerun for a New Week

To rerun the workflow for a new week or product:

1. Update the selected product in `.env` or config
2. Refresh the public review data source
3. Adjust the review window if needed
4. Run the pipeline again
5. Review the files generated in `output/`

The workflow is designed to be repeatable with minimal manual effort, which is important for a weekly pulse use case.

## Deliverables

This repository is intended to support the following challenge deliverables:
- Working prototype link or demo video (up to 3 minutes)
- Latest one-page weekly note in PDF, DOC, or MD format
- Draft email as screenshot or text
- Reviews CSV used for the analysis, with redaction if needed
- README with rerun steps and theme legend

## Output Files

### `output/reviews.csv`
Normalized review data used as the input for analysis. PII is redacted if present in raw data.

### `output/weekly-note.md`
A concise weekly pulse containing:
- Top 3 themes
- 3 real user quotes
- 3 action ideas

### `output/email-draft.md`
A draft email version of the weekly update for stakeholders.

## Quality Guardrails

- Only public review sources are used
- No PII is included in outputs
- Quotes come from real imported reviews, not invented summaries
- The final note remains concise and scannable (≤250 words)

## Future Improvements

Possible future upgrades beyond version 1:
- Better theme clustering with embeddings
- More reliable quote validation
- Product-wise historical comparison across weeks
- Enhanced dashboard for longitudinal trends

## Demo Tips

If you are recording a demo, show this sequence:
1. Raw review input
2. Theme grouping logic
3. Weekly note generation
4. Email draft output
5. Final files in the `output/` folder

This makes the submission easy to follow and maps directly to the expected challenge outputs.

## MCP Setup (Optional)

To enable Stage 6 (Google Docs + Gmail push), follow these steps:
1. Create a Google Cloud Project and enable **Google Docs API** and **Gmail API**.
2. Create **OAuth 2.0 Credentials** (Desktop app type).
3. Download the JSON and save it as `credentials.json` in the project root.
4. Set `GOOGLE_DOC_ID` and `ENABLE_GMAIL_SEND=true` in `.env`.
5. Run the pipeline; follow the terminal link to authorize and paste the code.

## Notes

This project is intentionally scoped to a **lightweight, repeatable prototype** rather than a production analytics platform. The goal is to show clear problem understanding, useful insight generation, and a workflow that can be rerun reliably for future weeks.

## Author

Sk Akash Ali
