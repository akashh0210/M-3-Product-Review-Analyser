FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn google-auth-oauthlib google-api-python-client streamlit requests pandas

COPY . .

RUN chmod +x start.sh

ENV PORT=7860

CMD ["./start.sh"]
