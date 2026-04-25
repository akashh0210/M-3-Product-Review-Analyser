import streamlit as st
import requests
import os
import pandas as pd
import io
import altair as alt
from datetime import datetime

# ──────────────────────────────────────────────
# Page Config (Groww Branding)
# ──────────────────────────────────────────────
st.set_page_config(
    page_title="Groww | Product Pulse",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ──────────────────────────────────────────────
# Premium Styling (Groww Green #00d09c)
# ──────────────────────────────────────────────
st.markdown("""
<style>
    /* Main Background */
    .main { background-color: #0e1117; }
    
    /* Metrics Cards */
    .stMetric { 
        background-color: #161b22; 
        padding: 20px; 
        border-radius: 12px; 
        border: 1px solid #30363d;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .stMetric:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 208, 156, 0.1);
        border-color: #00d09c;
    }
    div[data-testid="stMetricValue"] { 
        font-size: 2.2rem; 
        font-weight: 700;
        color: #ffffff;
    }
    
    /* Tabs */
    .stTabs [data-baseweb="tab-list"] { gap: 8px; border-bottom: 2px solid #30363d; }
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        border: none;
        padding: 10px 24px;
        color: #8b949e;
        font-weight: 600;
    }
    .stTabs [aria-selected="true"] {
        color: #00d09c;
        border-bottom: 3px solid #00d09c;
        background-color: transparent;
    }
    
    /* Buttons */
    .stButton>button {
        background-color: #00d09c;
        color: #ffffff;
        border: none;
        font-weight: 600;
        border-radius: 8px;
        transition: background-color 0.2s;
    }
    .stButton>button:hover {
        background-color: #00b386;
        color: #ffffff;
    }
    
    /* Links as buttons */
    .stLinkButton>a {
        border-color: #30363d !important;
        color: #ffffff !important;
        border-radius: 8px !important;
    }
    .stLinkButton>a:hover {
        border-color: #00d09c !important;
        color: #00d09c !important;
    }

    /* Markdown headers */
    h1, h2, h3 { color: #ffffff; }
    .block-container { padding-top: 2rem; }
    
    /* Progress Bar */
    .stProgress > div > div > div > div {
        background-color: #00d09c;
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
# Data Fetching
# ──────────────────────────────────────────────
@st.cache_data(ttl=300)
def fetch_github_file(path: str) -> str | None:
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
        return {"count": 0, "avg_rating": 0.0, "app_store": 0, "play_store": 0, "positive": 0, "negative": 0}
    
    count = len(df)
    avg_rating = round(df["rating"].mean(), 1) if "rating" in df.columns else 0.0
    
    app_store = int((df["source"] == "App Store").sum()) if "source" in df.columns else 0
    play_store = int((df["source"] == "Play Store").sum()) if "source" in df.columns else 0
    
    # Sentiment Breakdown
    positive = int((df["rating"] >= 4).sum()) if "rating" in df.columns else 0
    negative = int((df["rating"] <= 2).sum()) if "rating" in df.columns else 0
    
    return {
        "count": count,
        "avg_rating": avg_rating,
        "app_store": app_store,
        "play_store": play_store,
        "positive": positive,
        "negative": negative
    }

# ──────────────────────────────────────────────
# GitHub Trigger
# ──────────────────────────────────────────────
def trigger_github_run():
    gh_token = os.getenv("GH_TOKEN")
    if not gh_token:
        st.sidebar.error("❌ `GH_TOKEN` missing in Space Secrets.")
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
            st.sidebar.success("🚀 Pipeline triggered! Check Actions.")
        else:
            st.sidebar.error(f"❌ Failed ({response.status_code})")
    except Exception as e:
        st.sidebar.error("❌ Network error.")

# ──────────────────────────────────────────────
# Sidebar
# ──────────────────────────────────────────────
st.sidebar.title("⚙️ Command Center")
st.sidebar.markdown("---")

if st.sidebar.button("🚀 Run Analysis Now", use_container_width=True):
    trigger_github_run()

if st.sidebar.button("🔄 Sync Live Data", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

st.sidebar.markdown("---")

st.sidebar.subheader("📬 Delivery Hub")
st.sidebar.link_button("📑 View Live Google Doc", f"https://docs.google.com/document/d/{DOC_ID}", use_container_width=True)
st.sidebar.link_button("✉️ Open Gmail Drafts", "https://mail.google.com/mail/u/0/#drafts", use_container_width=True)

st.sidebar.markdown("---")

st.sidebar.subheader("📱 Product Context")
product_name = os.getenv("PRODUCT_NAME", "Groww")
st.sidebar.text_input("Product", value=product_name, disabled=True)
st.sidebar.text_input("App Store ID", value=os.getenv("APP_STORE_ID", "1404871703"), disabled=True)
st.sidebar.text_input("Play Store ID", value=os.getenv("PLAY_STORE_PACKAGE", "com.nextbillion.groww"), disabled=True)

st.sidebar.caption("v2.1.0 | Groww Pulse Engine")

# ──────────────────────────────────────────────
# Main Content
# ──────────────────────────────────────────────
col_header1, col_header2 = st.columns([3, 1])
with col_header1:
    st.title(f"📈 {product_name} | Product Pulse")
    st.caption(f"Live Insights • Last refreshed: {datetime.now().strftime('%d %b %Y, %I:%M %p')}")

# Load data
df = fetch_reviews_df()
metrics = get_metrics(df)

# ──────────────────────────────────────────────
# Premium KPI Row
# ──────────────────────────────────────────────
k1, k2, k3, k4 = st.columns(4)
with k1:
    st.metric("📊 Processed Reviews", f"{metrics['count']:,}")
with k2:
    delta_color = "normal" if metrics['avg_rating'] >= 4.0 else "inverse"
    st.metric("⭐ Avg Rating", f"{metrics['avg_rating']}/5", delta="Target: 4.5+", delta_color=delta_color)
with k3:
    if metrics['count'] > 0:
        pos_pct = round((metrics['positive'] / metrics['count']) * 100)
        st.metric("💚 Positive Sentiment", f"{pos_pct}%")
    else:
        st.metric("💚 Positive Sentiment", "0%")
with k4:
    if metrics['count'] > 0:
        neg_pct = round((metrics['negative'] / metrics['count']) * 100)
        st.metric("💔 Critical Sentiment", f"{neg_pct}%", delta="Needs Attention", delta_color="inverse")
    else:
        st.metric("💔 Critical Sentiment", "0%")

st.markdown("<br>", unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Core Views
# ──────────────────────────────────────────────
tab_analytics, tab_note, tab_email = st.tabs(["📊 Advanced Analytics", "🧠 AI Insights Note", "✉️ Exec Email Draft"])

with tab_analytics:
    if df is not None and not df.empty:
        # Row 1: Trend Line & Sentiment Donut
        c1, c2 = st.columns([2, 1])
        
        with c1:
            st.subheader("📈 Rating Trend (Daily Average)")
            if 'date' in df.columns:
                trend_df = df.groupby(df['date'].dt.date)['rating'].mean().reset_index()
                # Altair Line Chart
                line_chart = alt.Chart(trend_df).mark_line(
                    color='#00d09c',
                    strokeWidth=3,
                    point=alt.OverlayMarkDef(filled=False, fill='white', size=50)
                ).encode(
                    x=alt.X('date:T', title='Date'),
                    y=alt.Y('rating:Q', title='Avg Rating', scale=alt.Scale(domain=[1, 5])),
                    tooltip=['date:T', 'rating:Q']
                ).properties(height=300).interactive()
                st.altair_chart(line_chart, use_container_width=True)
            else:
                st.info("No date data available for trend.")

        with c2:
            st.subheader("🎭 Sentiment Distribution")
            if 'rating' in df.columns:
                # Group ratings into sentiment
                def categorize(r):
                    if r >= 4: return 'Positive (4-5)'
                    elif r == 3: return 'Mixed (3)'
                    else: return 'Negative (1-2)'
                
                df['Sentiment'] = df['rating'].apply(categorize)
                sentiment_counts = df['Sentiment'].value_counts().reset_index()
                sentiment_counts.columns = ['Sentiment', 'Count']
                
                # Altair Donut Chart
                donut_chart = alt.Chart(sentiment_counts).mark_arc(innerRadius=50).encode(
                    theta=alt.Theta(field="Count", type="quantitative"),
                    color=alt.Color(field="Sentiment", type="nominal", 
                                    scale=alt.Scale(
                                        domain=['Positive (4-5)', 'Mixed (3)', 'Negative (1-2)'],
                                        range=['#00d09c', '#fbbf24', '#ef4444']
                                    ),
                                    legend=alt.Legend(title=None, orient='bottom')),
                    tooltip=['Sentiment', 'Count']
                ).properties(height=300)
                st.altair_chart(donut_chart, use_container_width=True)

        st.markdown("---")
        
        # Row 2: Basic distributions
        c3, c4 = st.columns(2)
        with c3:
            st.subheader("⭐ Rating Breakdown")
            rating_counts = df['rating'].value_counts().reset_index()
            rating_counts.columns = ['Rating', 'Count']
            bar_chart = alt.Chart(rating_counts).mark_bar(color='#00d09c', cornerRadiusTopLeft=3, cornerRadiusTopRight=3).encode(
                x=alt.X('Rating:O', title='Star Rating'),
                y=alt.Y('Count:Q', title='Volume'),
                tooltip=['Rating', 'Count']
            ).properties(height=250)
            st.altair_chart(bar_chart, use_container_width=True)
            
        with c4:
            st.subheader("📱 Platform Split")
            if 'source' in df.columns:
                source_counts = df['source'].value_counts().reset_index()
                source_counts.columns = ['Source', 'Count']
                pie_chart = alt.Chart(source_counts).mark_arc().encode(
                    theta=alt.Theta(field="Count", type="quantitative"),
                    color=alt.Color(field="Source", type="nominal", scale=alt.Scale(scheme='set2'), legend=alt.Legend(orient='bottom')),
                    tooltip=['Source', 'Count']
                ).properties(height=250)
                st.altair_chart(pie_chart, use_container_width=True)

    else:
        st.info("No review data available yet. Click 'Run Analysis Now' to fetch data.")

with tab_note:
    st.subheader("Weekly AI Insights")
    note = fetch_github_file("output/weekly-note.md")
    if note:
        st.markdown(f"<div style='background-color:#161b22; padding:20px; border-radius:10px; border:1px solid #30363d;'>{note}</div>", unsafe_allow_html=True)
    else:
        st.info("No insights found. Run the pipeline to generate your first pulse!")

with tab_email:
    st.subheader("Executive Summary Email")
    email = fetch_github_file("output/email-draft.md")
    if email:
        st.markdown(f"<div style='background-color:#161b22; padding:20px; border-radius:10px; border:1px solid #30363d;'>{email}</div>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        st.link_button("📤 Open in Gmail Drafts", "https://mail.google.com/mail/u/0/#drafts")
    else:
        st.info("No email draft found yet.")
