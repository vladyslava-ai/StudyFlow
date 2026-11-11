FROM node:22-alpine AS frontend-build

WORKDIR /project/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./`nRUN mkdir -p /project/backend/static
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /project/backend/static ./static

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
