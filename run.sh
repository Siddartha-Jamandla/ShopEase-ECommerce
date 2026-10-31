#!/usr/bin/env bash
# ShopEase full-stack launcher (Linux/macOS)
# Seeds the database (if empty) and starts the Python backend,
# which also serves the frontend at http://localhost:8000/
set -euo pipefail
cd "$(dirname "$0")"

# Load backend/.env if present
if [ -f backend/.env ]; then
  set -a; source backend/.env; set +a
fi

echo "[run] seeding database..."
python3 backend/seed.py

echo "[run] starting ShopEase backend..."
exec python3 backend/app.py
