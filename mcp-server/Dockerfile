FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn google-auth-oauthlib google-api-python-client streamlit requests pandas

COPY . .

# Convert any CRLF line endings to LF (safety net for Windows-authored files)
RUN dos2unix start.sh && chmod +x start.sh

ENV PORT=7860
EXPOSE 7860

CMD ["./start.sh"]
