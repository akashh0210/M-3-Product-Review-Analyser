FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker cache
COPY mcp-server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir streamlit requests pandas altair

# Copy all files from mcp-server to /app
COPY mcp-server/ .

# Fix line endings and permissions for the start script
RUN dos2unix start.sh && chmod +x start.sh

# HF Spaces configuration
ENV PORT=7860
EXPOSE 7860

# Start both services
CMD ["./start.sh"]
