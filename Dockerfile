FROM python:3.14-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir fastapi uvicorn google-auth-oauthlib google-api-python-client streamlit requests pandas

# Copy the server code
COPY mcp-server/ .

# Ensure start script is executable
RUN chmod +x start.sh

# HF Spaces use 7860
ENV PORT=7860
EXPOSE 7860

# Start both services
CMD ["./start.sh"]
