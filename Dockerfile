FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    dos2unix \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker cache
COPY mcp-server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir streamlit requests pandas altair

# Copy all files from mcp-server to /app
COPY mcp-server/ .

# Setup Nginx as a reverse proxy to handle both FastAPI (API) and Streamlit (UI) on port 7860
RUN echo 'server { \n\
    listen 7860; \n\
    location /append_to_doc { \n\
        proxy_pass http://localhost:8000; \n\
    } \n\
    location /create_email_draft { \n\
        proxy_pass http://localhost:8000; \n\
    } \n\
    location / { \n\
        proxy_pass http://localhost:8501; \n\
        proxy_http_version 1.1; \n\
        proxy_set_header Upgrade $http_upgrade; \n\
        proxy_set_header Connection "upgrade"; \n\
        proxy_set_header Host $host; \n\
    } \n\
}' > /etc/nginx/sites-available/default

# Fix line endings and permissions for the start script
RUN dos2unix start.sh && chmod +x start.sh

# HF Spaces configuration
ENV PORT=7860
EXPOSE 7860

# Start services via the start script
CMD ["./start.sh"]
