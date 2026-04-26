---
title: Product Review Analyser
emoji: 📈
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# App Review Insights Analyser

An AI-powered workflow that converts recent public App Store and Google Play reviews into a concise weekly product pulse for Product, Growth, Support, and Leadership teams. 

The project ingests reviews from the last 8–12 weeks, groups feedback into themes, extracts grounded user quotes, generates action ideas, and drafts a stakeholder-ready weekly note and email summary.

## Challenge Context

This project is built for the **PM Fellowship Learn in Public Challenge** based on the **App Review Insights Analyser** problem statement. The goal is to transform high-volume public feedback into actionable weekly insights.

## Core Features

- **Store Scrapers:** Automatic fetching from Apple App Store and Google Play Store.
- **Privacy First:** Automatic PII scrubbing (emails, phone numbers, UPI IDs) at the source.
- **AI Analysis:** Scalable theme clustering using LLMs (Llama 3.3/8b) with automatic batching for large datasets.
- **Grounded Insights:** Every quote in the weekly note is verified to be an exact word-for-word copy from a real review.
- **Multi-Channel Delivery:** Generates Markdown reports, Email drafts, and optionally pushes to Google Docs/Gmail via MCP.

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript (ESM)
- **AI Models:** Groq Cloud (`llama-3.3-70b-versatile` for synthesis, `llama-3.1-8b-instant` for processing)
- **Frontend Dashboard:** Streamlit (Python)
- **Backend Bridge:** FastAPI (Python)
- **Automation:** GitHub Actions (Weekly cron + dispatch)
- **Infrastructure:** Hugging Face Spaces (Docker)
- **Reverse Proxy:** Nginx (Internal routing for API + Dashboard)
- **APIs:** Google Docs & Gmail (via Google OAuth 2.0)

---

## Phase-wise Workflow

### Phase 1: Ingestion
Fetches reviews from the Apple App Store and Google Play Store. Includes a CSV fallback path in case of network or rate limits.
- **Run:** `npm run start` (as part of the full pipeline)
- **Output:** `data/raw/appstore-reviews.json`, `data/raw/playstore-reviews.json`

### Phase 2: Processing
Normalizes review data, filters to a configurable window (8-12 weeks), and scrubs PII.
- **Output:** `output/reviews.csv` (Normalized & Cleaned)

### Phase 3: AI Analysis
Groups feedback into ≤5 themes, identifies the top 3, extracts grounded quotes, and generates 3 action ideas.
- **Models:** Uses `llama-3.1-8b-instant` for scalable batch processing and `llama-3.3-70b-versatile` for high-quality note generation.

### Phase 4: Generation
Creates the weekly note (≤250 words) and stakeholder email.
- **Output:** `output/weekly-note.md`, `output/email-draft.md`

### Phase 5: Evaluation
A dedicated validation suite to ensure quality, privacy, and grounding.
- **Run:** `npm run validate`
- **Run All:** `npm run run` (Executes full pipeline then validates)

### Phase 6: Automation (Optional)
Automates the pipeline using GitHub Actions to run every Monday.
- **Workflow:** `.github/workflows/weekly_pulse.yml`
- **Output:** Automatically commits updated reports to the `output/` directory.

---

## Automation Setup

To enable weekly automated runs on GitHub:

1.  **Push to GitHub**: Push your local repository to a new GitHub repository.
2.  **Add Secrets**: 
    - Go to `Settings > Secrets and variables > Actions`.
    - Click `New repository secret`.
    - Name: `GROQ_API_KEY`, Value: `your_api_key_here`.
3.  **Set Permissions**:
    - Go to `Settings > Actions > General`.
    - Scroll to `Workflow permissions`.
    - Select `Read and write permissions`.
    - Click `Save`.

## Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/your-username/app-review-analyser.git
cd app-review-analyser
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file based on `.env.example`:

| Variable | Description |
| :--- | :--- |
| `GROQ_API_KEY` | Your Groq Cloud API Key |
| `MCP_SERVER_URL` | The URL of your hosted FastAPI bridge (e.g., Hugging Face) |
| `M3_HF_TOKEN` | (Required) Access token for sync and MCP auth |
| `GOOGLE_DOC_ID` | The ID of the Google Doc to append results to |
| `GMAIL_RECIPIENTS` | Comma-separated list of emails |

### 3. Deploy the MCP Bridge (Hugging Face)
To enable Google Docs and Gmail, you must deploy the internal bridge:
1.  Create a **Docker Space** on Hugging Face.
2.  Upload the contents of the `mcp-server/` folder.
3.  Add `GOOGLE_CREDENTIALS_JSON` and `GOOGLE_TOKEN_JSON` as **Secrets** in HF Settings.
4.  Add `M3_HF_TOKEN` as a **Secret** in HF Settings (this token will be checked against incoming requests).
5.  Copy the **Direct URL** into your `.env` as `MCP_SERVER_URL`.

## Live Dashboard

The hosted deployment includes an **Executive Dashboard** that allows stakeholders to:
- **Visualize Sentiment:** Real-time donut charts and rating velocity trends.
- **Trigger Analysis:** A one-click button to dispatch a fresh GitHub Actions run.
- **Direct Access:** One-click links to the generated Google Doc and Gmail Drafts.
- **Sync Status:** Real-time verification of the data pipeline health.

## Usage

### Run Locally
```bash
npm run run
```

### Automated Weekly Run
The pipeline is pre-configured to run every **Monday at 00:00 UTC** via GitHub Actions.
You can also trigger it manually from the **Actions** tab in your repository.

---

## Deliverables

1.  **[reviews.csv](output/reviews.csv)**: Normalized data used for analysis.
2.  **[weekly-note.md](output/weekly-note.md)**: A one-page scannable pulse (Top 3 themes, 3 quotes, 3 actions).
3.  **[email-draft.md](output/email-draft.md)**: A professional email draft for stakeholders.
4.  **Documentation**: This README, [Architecture](Docs/architecture.md), and [Problem Statement](Docs/problemstatement.md).

---

## MCP Setup (Optional)

To enable **Stage 6 (Google Docs + Gmail push)**:
1. Create a Google Cloud Project with Docs and Gmail APIs enabled.
2. Download your OAuth 2.0 Credentials as `credentials.json` in the root.
3. Configure `GOOGLE_DOC_ID` and `ENABLE_GMAIL_SEND` in `.env`.
4. The first run will provide an authorization link in the terminal.

---

## Theme Legend

The system identifies recurring themes such as:
- **App Performance & Features:** Speed, crashes, and core functionality.
- **KYC & Onboarding:** Verification friction and account setup.
- **Customer Support:** Responsiveness and issue resolution.
- **Brokerage & Fees:** Transparency and cost-related feedback.
- **UI & UX:** Navigation, design, and user journey.

---

## Author
**Sk Akash Ali**
PM Fellowship Fellow
