FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install python-dotenv httpx pytest

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Copy and run start script
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
