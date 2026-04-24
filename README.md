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

---

## 🛠️ Phase-wise Workflow

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

## ⏰ Automation Setup

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
4.  **Optional Variables**: You can also add `Variables` (like `PRODUCT_NAME`, `APP_STORE_ID`) in the same settings page to override defaults without changing code.

The pipeline will now run every Monday at 9:30 AM IST and commit the results back to your repo!

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- [Groq API Key](https://console.groq.com/) (Free tier works)

### Installation
```bash
git clone <your-repo-url>
cd app-review-insights-analyser
npm install
```

### Configuration
Create a `.env` file from the provided template:
```env
GROQ_API_KEY=gsk_...
PRODUCT_NAME=Groww
APP_STORE_ID=1404684361
PLAY_STORE_PACKAGE=com.nextbillion.groww
REVIEW_WINDOW_WEEKS=12
MAX_THEMES=5

# Optional MCP (Google Docs + Gmail)
GOOGLE_DOC_ID=...
ENABLE_GMAIL_SEND=false
GMAIL_RECIPIENTS=...
```

---

## 📦 Deliverables

1.  **[reviews.csv](output/reviews.csv)**: Normalized data used for analysis.
2.  **[weekly-note.md](output/weekly-note.md)**: A one-page scannable pulse (Top 3 themes, 3 quotes, 3 actions).
3.  **[email-draft.md](output/email-draft.md)**: A professional email draft for stakeholders.
4.  **Documentation**: This README, [Architecture](Docs/architecture.md), and [Problem Statement](Docs/problemstatement.md).

---

## 🔌 MCP Setup (Optional)

To enable **Stage 6 (Google Docs + Gmail push)**:
1. Create a Google Cloud Project with Docs and Gmail APIs enabled.
2. Download your OAuth 2.0 Credentials as `credentials.json` in the root.
3. Configure `GOOGLE_DOC_ID` and `ENABLE_GMAIL_SEND` in `.env`.
4. The first run will provide an authorization link in the terminal.

---

## 🏷️ Theme Legend

The system identifies recurring themes such as:
- **App Performance & Features:** Speed, crashes, and core functionality.
- **KYC & Onboarding:** Verification friction and account setup.
- **Customer Support:** Responsiveness and issue resolution.
- **Brokerage & Fees:** Transparency and cost-related feedback.
- **UI & UX:** Navigation, design, and user journey.

---

## 👤 Author
**Sk Akash Ali**
PM Fellowship Fellow
