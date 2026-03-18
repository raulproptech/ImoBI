#!/usr/bin/env bash
set -e

echo "🚀 Iniciando Imobi (backend + frontend)..."

if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo "❌ Execute este script dentro da pasta imobi/"
  exit 1
fi

# Backend
(
  cd backend
  if [ ! -d "venv" ]; then
    python -m venv venv
  fi
  source venv/bin/activate
  pip install -r requirements.txt
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
) &

# Frontend
(
  cd frontend
  if [ ! -d "venv" ]; then
    python -m venv venv
  fi
  source venv/bin/activate
  pip install -r requirements.txt
  reflex run --env dev --frontend-port 3000
) &

wait
