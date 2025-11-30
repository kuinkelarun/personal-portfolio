FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Install system deps needed for some Python packages (if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default port used by Fly and many hosts
ENV PORT=8080

EXPOSE ${PORT}

CMD ["gunicorn", "--bind", "0.0.0.0:${PORT}", "--workers", "2", "app:app"]
