import streamlit as st
import requests
import os
import pandas as pd
import io
import altair as alt
from datetime import datetime

# ──────────────────────────────────────────────
# Page Config (Minimalist)
# ──────────────────────────────────────────────
st.set_page_config(
    page_title="Groww | Product Insights",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ──────────────────────────────────────────────
# Executive Styling (Minimalist)
# ──────────────────────────────────────────────
st.markdown("""
<style>
    /* Global Styles */
    .main { background-color: #0e1117; }
    
    /* Metrics Styling */
    .stMetric { 
        background-color: #161b22; 
        padding: 24px; 
        border-radius: 8px; 
        border: 1px solid #30363d;
        transition: border-color 0.3s ease;
    }
    .stMetric:hover {
        border-color: #00d09c;
    }
    div[data-testid="stMetricValue"] { 
        font-size: 2.4rem; 
        font-weight: 600;
        letter-spacing: -0.02em;
    }
    
    /* Tabs */
    .stTabs [data-baseweb="tab-list"] { gap: 12px; }
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        padding: 8px 16px;
        color: #8b949e;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.85rem;
    }
    .stTabs [aria-selected="true"] {
        color: #00d09c;
        border-bottom: 2px solid #00d09c;
    }
    
    /* Buttons */
    .stButton>button {
        background-color: #00d09c;
        color: #ffffff;
        border: none;
        padding: 0.5rem 1rem;
        font-weight: 500;
        border-radius: 4px;
        width: 100%;
    }
    .stButton>button:hover {
        background-color: #00b386;
        color: #ffffff;
    }
    
    /* Sidebar Links */
    .stLinkButton>a {
        border: 1px solid #30363d !important;
        background-color: transparent !important;
        color: #c9d1d9 !important;
        border-radius: 4px !important;
        font-size: 0.9rem !important;
    }
    .stLinkButton>a:hover {
        border-color: #00d09c !important;
        color: #00d09c !important;
    }

    h1, h2, h3 { font-weight: 600; letter-spacing: -0.01em; }
    .block-container { padding-top: 2.5rem; }
</style>
""", unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Data Layer
# ──────────────────────────────────────────────
GITHUB_USER = "akashh0210"
REPO_NAME = "M-3-Product-Review-Analyser"
BRANCH = "main"

@st.cache_data(ttl=300)
def fetch_github_file(path: str) -> str | None:
    url = f"https://raw.githubusercontent.com/{GITHUB_USER}/{REPO_NAME}/{BRANCH}/{path}"
    try:
        res = requests.get(url, timeout=10)
        return res.text if res.status_code == 200 else None
    except Exception:
        return None

@st.cache_data(ttl=300)
def fetch_reviews_df() -> pd.DataFrame | None:
    csv_text = fetch_github_file("output/reviews.csv")
    if csv_text:
        try:
            df = pd.read_csv(io.StringIO(csv_text))
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
            return df
        except Exception:
            return None
    return None

def get_metrics(df: pd.DataFrame | None) -> dict:
    if df is None or df.empty:
        return {"count": 0, "avg_rating": 0.0, "positive": 0, "negative": 0}
    count = len(df)
    avg_rating = round(df["rating"].mean(), 1) if "rating" in df.columns else 0.0
    positive = int((df["rating"] >= 4).sum())
    negative = int((df["rating"] <= 2).sum())
    return {"count": count, "avg_rating": avg_rating, "positive": positive, "negative": negative}

# ──────────────────────────────────────────────
# Sidebar: Administrative Controls
# ──────────────────────────────────────────────
st.sidebar.title("ADMINISTRATION")
st.sidebar.caption("Pipeline Controls & Configuration")
st.sidebar.markdown("<br>", unsafe_allow_html=True)

if st.sidebar.button("Execute Manual Analysis"):
    gh_token = os.getenv("GH_TOKEN")
    if gh_token:
        url = f"https://api.github.com/repos/{GITHUB_USER}/{REPO_NAME}/actions/workflows/weekly_pulse.yml/dispatches"
        headers = {"Authorization": f"Bearer {gh_token}", "Accept": "application/vnd.github+json"}
        try:
            response = requests.post(url, headers=headers, json={"ref": "main"}, timeout=10)
            if response.status_code == 204: st.sidebar.success("Workflow Dispatched")
            else: st.sidebar.error("Dispatch Failed")
        except Exception: st.sidebar.error("Network Error")
    else:
        st.sidebar.error("GH_TOKEN Not Found")

if st.sidebar.button("Synchronize Data"):
    st.cache_data.clear()
    st.rerun()

st.sidebar.markdown("<br>", unsafe_allow_html=True)
st.sidebar.subheader("DELIVERY ENDPOINTS")
doc_id = os.getenv("GOOGLE_DOC_ID", "1lEv0CfmaeMp0hdLeljRQ2XHdcS46WQjtBjIwtgC0rmM")
st.sidebar.link_button("Review Analysis Document", f"https://docs.google.com/document/d/{doc_id}", use_container_width=True)
st.sidebar.link_button("Gmail Drafts Folder", "https://mail.google.com/mail/u/0/#drafts", use_container_width=True)

st.sidebar.markdown("<br>", unsafe_allow_html=True)
st.sidebar.subheader("CONFIGURATION")
st.sidebar.text_input("Product Name", value=os.getenv("PRODUCT_NAME", "Groww"), disabled=True)
st.sidebar.text_input("App Store ID", value=os.getenv("APP_STORE_ID", "1404871703"), disabled=True)
st.sidebar.text_input("Play Store ID", value=os.getenv("PLAY_STORE_PACKAGE", "com.nextbillion.groww"), disabled=True)

st.sidebar.caption("v2.2.0 | Standard Edition")

# ──────────────────────────────────────────────
# Main Dashboard
# ──────────────────────────────────────────────
st.title("Groww | Product Insights Dashboard")
st.caption(f"Status: Operational • Last Updated: {datetime.now().strftime('%d %b %Y, %I:%M %p')}")
st.markdown("<br>", unsafe_allow_html=True)

df = fetch_reviews_df()
metrics = get_metrics(df)

# KPI Row
k1, k2, k3, k4 = st.columns(4)
with k1: st.metric("Reviews Processed", f"{metrics['count']:,}")
with k2: st.metric("Average Rating", f"{metrics['avg_rating']}/5.0")
with k3: 
    val = round((metrics['positive']/metrics['count']*100)) if metrics['count'] > 0 else 0
    st.metric("Positive Sentiment", f"{val}%")
with k4: 
    val = round((metrics['negative']/metrics['count']*100)) if metrics['count'] > 0 else 0
    st.metric("Critical Sentiment", f"{val}%")

st.markdown("<br>", unsafe_allow_html=True)

# Tabs
tab_analysis, tab_insights, tab_draft = st.tabs(["Quantitative Analysis", "Executive Summary", "Communication Draft"])

with tab_analysis:
    if df is not None and not df.empty:
        col_left, col_right = st.columns([2, 1])
        
        with col_left:
            st.subheader("Rating Velocity")
            if 'date' in df.columns:
                trend_df = df.groupby(df['date'].dt.date)['rating'].mean().reset_index()
                chart = alt.Chart(trend_df).mark_line(color='#00d09c', strokeWidth=2).encode(
                    x=alt.X('date:T', title='Timeline'),
                    y=alt.Y('rating:Q', title='Rating', scale=alt.Scale(domain=[1, 5])),
                    tooltip=['date:T', 'rating:Q']
                ).properties(height=350).interactive()
                st.altair_chart(chart, use_container_width=True)

        with col_right:
            st.subheader("Sentiment Distribution")
            def categorize(r):
                if r >= 4: return 'Positive'
                elif r == 3: return 'Mixed'
                else: return 'Negative'
            df['Sentiment'] = df['rating'].apply(categorize)
            counts = df['Sentiment'].value_counts().reset_index()
            counts.columns = ['Sentiment', 'Value']
            donut = alt.Chart(counts).mark_arc(innerRadius=60).encode(
                theta="Value:Q",
                color=alt.Color("Sentiment:N", scale=alt.Scale(domain=['Positive', 'Mixed', 'Negative'], range=['#00d09c', '#fbbf24', '#ef4444']), legend=alt.Legend(orient="bottom")),
                tooltip=['Sentiment', 'Value']
            ).properties(height=350)
            st.altair_chart(donut, use_container_width=True)
            
        st.markdown("---")
        st.subheader("Rating Volume by Star Count")
        ratings = df['rating'].value_counts().reset_index()
        ratings.columns = ['Rating', 'Count']
        bar = alt.Chart(ratings).mark_bar(color='#00d09c', size=40).encode(
            x=alt.X('Rating:O', title='Star Rating'),
            y=alt.Y('Count:Q', title='Volume'),
            tooltip=['Rating', 'Count']
        ).properties(height=300)
        st.altair_chart(bar, use_container_width=True)
    else:
        st.info("Insufficient data for quantitative analysis.")

with tab_insights:
    st.subheader("Weekly Product Pulse")
    note = fetch_github_file("output/weekly-note.md")
    if note:
        st.markdown(f"<div style='background-color:#161b22; padding:32px; border-radius:8px; border:1px solid #30363d; line-height:1.6;'>{note}</div>", unsafe_allow_html=True)
    else:
        st.info("Insights pending next analysis cycle.")

with tab_draft:
    st.subheader("Stakeholder Email Draft")
    email = fetch_github_file("output/email-draft.md")
    if email:
        # Action Bar for Draft Generation
        col_draft1, col_draft2 = st.columns([1, 1])
        
        with col_draft1:
            if st.button("Generate Live Gmail Draft", use_container_width=True):
                with st.spinner("Communicating with Gmail API..."):
                    # Basic parsing of the markdown content
                    lines = email.split('\n')
                    subject = "Weekly App Review Pulse"
                    recipients = os.getenv("GMAIL_RECIPIENTS", "product-team@groww.in")
                    
                    for line in lines:
                        if "**Subject:**" in line:
                            subject = line.replace("**Subject:**", "").strip()
                    
                    # Call local FastAPI bridge
                    try:
                        payload = {
                            "to": recipients,
                            "subject": subject,
                            "body": email
                        }
                        res = requests.post("http://localhost:8000/create_email_draft", json=payload, timeout=15)
                        if res.status_code == 200:
                            st.toast("Draft Created Successfully!", icon="✅")
                            st.success("Draft is now waiting in your Gmail 'Drafts' folder.")
                        else:
                            st.error(f"Failed to create draft: {res.text}")
                    except Exception as e:
                        st.error(f"Connection Error: Ensure FastAPI bridge is running. ({str(e)})")
        
        with col_draft2:
            st.link_button("Open Gmail Drafts Folder", "https://mail.google.com/mail/u/0/#drafts", use_container_width=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown(f"<div style='background-color:#161b22; padding:32px; border-radius:8px; border:1px solid #30363d; font-family:monospace;'>{email}</div>", unsafe_allow_html=True)
    else:
        st.info("Communication draft not available.")
