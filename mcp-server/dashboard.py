import streamlit as st
import requests
import os
import pandas as pd
from datetime import datetime

# --- Page Config ---
st.set_page_config(
    page_title="Groww | Product Pulse Dashboard",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Styling ---
st.markdown("""
    <style>
    .main {
        background-color: #0e1117;
    }
    .stButton>button {
        width: 100%;
        border-radius: 5px;
        height: 3em;
        background-color: #00d09c;
        color: white;
    }
    .status-box {
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #30363d;
        background-color: #161b22;
        margin-bottom: 20px;
    }
    </style>
    """, unsafe_allow_html=True)

# --- Sidebar / Settings ---
st.sidebar.title("⚙️ Control Center")
st.sidebar.markdown("---")

mcp_url = os.getenv("MCP_SERVER_URL", "https://akashh0210-product-pulse-server.hf.space")
doc_id = os.getenv("GOOGLE_DOC_ID", "1lEv0CfmaeMp0hdLeljRQ2XHdcS46WQjtBjIwtgC0rmM")

st.sidebar.info(f"📍 **Server:** {mcp_url}")
st.sidebar.info(f"📑 **Doc ID:** {doc_id[:10]}...")

def trigger_github_run():
    gh_token = os.getenv("GH_TOKEN")
    if not gh_token:
        st.sidebar.error("❌ GH_TOKEN not found in Secrets")
        return

    repo = "akashh0210/M-3-Product-Review-Analyser"
    workflow_id = "weekly-pulse.yml"
    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_id}/dispatches"
    
    headers = {
        "Authorization": f"Bearer {gh_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    
    data = {"ref": "main"}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 204:
            st.sidebar.success("🚀 Pipeline Triggered! Check GitHub Actions.")
        else:
            st.sidebar.error(f"Failed: {response.status_code}")
            st.sidebar.json(response.json())
    except Exception as e:
        st.sidebar.error(f"Error: {str(e)}")

st.sidebar.markdown("---")
if st.sidebar.button("🚀 Trigger Manual Run"):
    trigger_github_run()

# --- Main Dashboard ---
st.title("📈 Product Pulse Dashboard")
st.markdown(f"**Last Sync:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

review_count = get_metrics()

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown('<div class="status-box">', unsafe_allow_html=True)
    st.subheader("📡 MCP Health")
    try:
        res = requests.get(f"{mcp_url}/", timeout=5)
        if res.status_code == 200:
            st.success("Online")
            st.json(res.json())
        else:
            st.error(f"Error: {res.status_code}")
    except:
        st.error("Offline / Connecting...")
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    st.markdown('<div class="status-box">', unsafe_allow_html=True)
    st.subheader("📑 Delivery")
    st.link_button("Open Google Doc", f"https://docs.google.com/document/d/{doc_id}")
    st.link_button("Open Gmail Drafts", "https://mail.google.com/mail/u/0/#drafts")
    st.markdown('</div>', unsafe_allow_html=True)

with col3:
    st.markdown('<div class="status-box">', unsafe_allow_html=True)
    st.subheader("🔄 Latest Data")
    st.metric("Reviews Scanned", f"{review_count}", "Live from GitHub")
    st.metric("Pipeline Status", "Ready")
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown("---")

# --- Insights Preview ---
st.header("📝 Latest Pulse Preview")
weekly_note = fetch_github_file("output/weekly-note.md")

if weekly_note:
    st.markdown(weekly_note)
else:
    st.info("No weekly note found. Run the pipeline to generate your first pulse!")

tab1, tab2 = st.tabs(["Weekly Note", "Sentiment Trend"])

with tab1:
    if weekly_note:
        st.markdown(weekly_note)
    else:
        st.info("No weekly note found.")

with tab2:
    chart_data = pd.DataFrame({
        'Week': ['W1', 'W2', 'W3', 'W4'],
        'Positive': [70, 75, 68, 82],
        'Negative': [30, 25, 32, 18]
    })
    st.line_chart(chart_data.set_index('Week'))

st.sidebar.markdown("---")
st.sidebar.caption("v1.2.0 | Built with Antigravity 🛸")
