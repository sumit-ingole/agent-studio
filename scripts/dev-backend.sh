#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."
service_dir="$PWD/apps/adio-base"

exec env -u DATABASE_URL "$service_dir/.venv/bin/python" -m uvicorn --env-file "$service_dir/.env" --app-dir "$service_dir" app.main:app --host 127.0.0.1 --port 8000
