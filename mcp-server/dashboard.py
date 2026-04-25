import streamlit as st
import requests
import os
import pandas as pd
import io
from datetime import datetime

# ──────────────────────────────────────────────
# Page Config
# ──────────────────────────────────────────────
st.set_page_config(
    page_title="Product Pulse Dashboard",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ──────────────────────────────────────────────
# Styling
# ──────────────────────────────────────────────
st.markdown("""
<style>
    .main { background-color: #0e1117; }
    .stMetric { background-color: #161b22; padding: 15px; border-radius: 10px; border: 1px solid #30363d; }
    .block-container { padding-top: 2rem; }
    div[data-testid="stMetricValue"] { font-size: 2rem; }
    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] {
        background-color: #161b22;
        border-radius: 8px 8px 0 0;
        border: 1px solid #30363d;
        padding: 10px 20px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #238636;
        border-color: #238636;
    }
</style>
""", unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
GITHUB_USER = "akashh0210"
REPO_NAME = "M-3-Product-Review-Analyser"
BRANCH = "main"

DOC_ID = os.getenv("GOOGLE_DOC_ID", "1lEv0CfmaeMp0hdLeljRQ2XHdcS46WQjtBjIwtgC0rmM")

# ──────────────────────────────────────────────
# Data Fetching (from GitHub raw files)
# ──────────────────────────────────────────────
@st.cache_data(ttl=300)  # cache for 5 minutes
def fetch_github_file(path: str) -> str | None:
    """Fetch a raw file from the GitHub repository."""
    url = f"https://raw.githubusercontent.com/{GITHUB_USER}/{REPO_NAME}/{BRANCH}/{path}"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            return res.text
        return None
    except Exception:
        return None

@st.cache_data(ttl=300)
def fetch_reviews_df() -> pd.DataFrame | None:
    """Fetch reviews.csv from GitHub and return as DataFrame."""
    csv_text = fetch_github_file("output/reviews.csv")
    if csv_text:
        try:
            return pd.read_csv(io.StringIO(csv_text))
        except Exception:
            return None
    return None

def get_metrics(df: pd.DataFrame | None) -> dict:
    """Extract key metrics from the reviews DataFrame."""
    if df is None or df.empty:
        return {"count": 0, "avg_rating": 0.0, "app_store": 0, "play_store": 0}
    
    count = len(df)
    avg_rating = round(df["rating"].mean(), 1) if "rating" in df.columns else 0.0
    
    app_store = 0
    play_store = 0
    if "source" in df.columns:
        app_store = int((df["source"] == "App Store").sum())
        play_store = int((df["source"] == "Play Store").sum())
    
    return {
        "count": count,
        "avg_rating": avg_rating,
        "app_store": app_store,
        "play_store": play_store
    }

# ──────────────────────────────────────────────
# GitHub Actions Trigger
# ──────────────────────────────────────────────
def trigger_github_run():
    """Trigger the weekly_pulse.yml workflow via GitHub API."""
    gh_token = os.getenv("GH_TOKEN")
    if not gh_token:
        st.sidebar.error("❌ `GH_TOKEN` not found in Space Secrets.")
        st.sidebar.caption("Add a GitHub Fine-Grained Token with Actions (Read+Write) permission.")
        return

    url = f"https://api.github.com/repos/{GITHUB_USER}/{REPO_NAME}/actions/workflows/weekly_pulse.yml/dispatches"
    headers = {
        "Authorization": f"Bearer {gh_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    try:
        response = requests.post(url, headers=headers, json={"ref": "main"}, timeout=10)
        if response.status_code == 204:
            st.sidebar.success("🚀 Pipeline triggered! Check GitHub Actions for progress.")
        elif response.status_code == 404:
            st.sidebar.error("❌ Workflow not found. Check that `weekly_pulse.yml` exists.")
        elif response.status_code == 422:
            st.sidebar.warning("⚠️ Workflow already running.")
        else:
            st.sidebar.error(f"❌ Failed ({response.status_code})")
    except Exception as e:
        st.sidebar.error(f"❌ Network error: {str(e)}")

# ──────────────────────────────────────────────
# Sidebar
# ──────────────────────────────────────────────
st.sidebar.title("⚙️ Control Center")
st.sidebar.markdown("---")

# Quick Actions
if st.sidebar.button("🚀 Run Analysis Now", use_container_width=True):
    trigger_github_run()

if st.sidebar.button("🔄 Refresh Data", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

st.sidebar.markdown("---")

# Delivery Links
st.sidebar.subheader("📬 Delivery")
st.sidebar.link_button("📑 Open Google Doc", f"https://docs.google.com/document/d/{DOC_ID}", use_container_width=True)
st.sidebar.link_button("✉️ Open Gmail Drafts", "https://mail.google.com/mail/u/0/#drafts", use_container_width=True)

st.sidebar.markdown("---")

# Product Configuration (read-only display)
st.sidebar.subheader("📱 Product Config")
product_name = os.getenv("PRODUCT_NAME", "Groww")
app_store_id = os.getenv("APP_STORE_ID", "1404871703")
play_store_pkg = os.getenv("PLAY_STORE_PACKAGE", "com.nextbillion.groww")
gmail_recipients = os.getenv("GMAIL_RECIPIENTS", "akash102502@gmail.com")

st.sidebar.text_input("Product Name", value=product_name, disabled=True)
st.sidebar.text_input("App Store ID", value=app_store_id, disabled=True)
st.sidebar.text_input("Play Store Package", value=play_store_pkg, disabled=True)
st.sidebar.text_input("Gmail Recipients", value=gmail_recipients, disabled=True)
st.sidebar.caption("ℹ️ Edit these in your `.env` file or HF Space Secrets.")

st.sidebar.markdown("---")

# Backend Health
st.sidebar.subheader("🔧 System")
try:
    res = requests.get("http://localhost:8000/", timeout=3)
    if res.status_code == 200:
        st.sidebar.success("FastAPI Backend: Online")
    else:
        st.sidebar.error(f"FastAPI Backend: Error {res.status_code}")
except Exception:
    st.sidebar.warning("FastAPI Backend: Starting...")

st.sidebar.caption("v2.0.0 | Product Pulse Engine")

# ──────────────────────────────────────────────
# Main Content
# ──────────────────────────────────────────────
st.title("📈 Product Pulse Dashboard")
st.caption(f"Last refreshed: {datetime.now().strftime('%d %b %Y, %I:%M %p')}")

# Load data
df = fetch_reviews_df()
metrics = get_metrics(df)

# ──────────────────────────────────────────────
# KPI Row
# ──────────────────────────────────────────────
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("📊 Reviews Scanned", f"{metrics['count']:,}")

with col2:
    st.metric("⭐ Avg Rating", f"{metrics['avg_rating']}/5")

with col3:
    st.metric("🍎 App Store", f"{metrics['app_store']:,}")

with col4:
    st.metric("🤖 Play Store", f"{metrics['play_store']:,}")

st.markdown("---")

# ──────────────────────────────────────────────
# Tabs: Weekly Note | Email Draft | Charts
# ──────────────────────────────────────────────
tab_note, tab_email, tab_charts = st.tabs(["📝 Weekly Note", "✉️ Email Draft", "📊 Analytics"])

with tab_note:
    weekly_note = fetch_github_file("output/weekly-note.md")
    if weekly_note:
        st.markdown(weekly_note)
    else:
        st.info("No weekly note found yet. Click **'Run Analysis Now'** in the sidebar to generate your first pulse!")

with tab_email:
    email_draft = fetch_github_file("output/email-draft.md")
    if email_draft:
        st.markdown(email_draft)
        st.markdown("---")
        st.link_button("📤 Open in Gmail Drafts", "https://mail.google.com/mail/u/0/#drafts")
    else:
        st.info("No email draft found yet. Run the pipeline first.")

with tab_charts:
    if df is not None and not df.empty:
        chart_col1, chart_col2 = st.columns(2)
        
        with chart_col1:
            st.subheader("⭐ Rating Distribution")
            if "rating" in df.columns:
                rating_counts = df["rating"].value_counts().sort_index()
                rating_df = pd.DataFrame({
                    "Rating": [f"★{int(r)}" for r in rating_counts.index],
                    "Count": rating_counts.values
                })
                st.bar_chart(rating_df.set_index("Rating"))
        
        with chart_col2:
            st.subheader("📱 Source Split")
            if "source" in df.columns:
                source_counts = df["source"].value_counts()
                source_df = pd.DataFrame({
                    "Source": source_counts.index,
                    "Count": source_counts.values
                })
                st.bar_chart(source_df.set_index("Source"))
    else:
        st.info("No review data available yet. Run the pipeline to generate analytics.")
