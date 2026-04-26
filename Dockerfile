FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker cache
COPY mcp-server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir streamlit requests pandas altair

# Copy the rest of the application
COPY mcp-server/ .

# Fix line endings and permissions for the start script
RUN apt-get update && apt-get install -y dos2unix \
    && dos2unix start.sh \
    && chmod +x start.sh \
    && apt-get purge -y dos2unix && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# HF Spaces use 7860
ENV PORT=7860
EXPOSE 7860

# Start both services
CMD ["./start.sh"]
