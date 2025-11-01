# Use Python 3.11 as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create requirements.txt from pyproject.toml dependencies
RUN echo "fastapi" > requirements.txt && \
    echo "httpx" >> requirements.txt && \
    echo "jira" >> requirements.txt && \
    echo "fastmcp" >> requirements.txt && \
    echo "python-dotenv" >> requirements.txt && \
    echo "pydantic" >> requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "main.py"]