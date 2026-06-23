#!/usr/bin/env bash
set -e

echo "=== Post-merge setup ==="

echo "--- Installing backend dependencies ---"
cd backend
pip install -q -r requirements.txt

echo "--- Running database migrations ---"
alembic upgrade head

cd ..

echo "--- Installing frontend dependencies ---"
cd frontend
npm install --legacy-peer-deps --prefer-offline 2>&1 | tail -5

cd ..

echo "=== Post-merge setup complete ==="
