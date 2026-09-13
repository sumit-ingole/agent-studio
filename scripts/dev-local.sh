#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."
service_dir="$PWD/apps/adio-base"
python_bin="$service_dir/.venv/bin/python"
if [[ ! -x "$python_bin" ]]; then
  print -u2 "Backend virtual environment is missing. Run: python3 -m venv apps/adio-base/.venv && apps/adio-base/.venv/bin/pip install -r apps/adio-base/requirements.txt"
  exit 1
fi

cleanup() {
  [[ -n "${backend_pid:-}" ]] && kill "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

env -u DATABASE_URL "$python_bin" -m uvicorn --env-file "$service_dir/.env" --app-dir "$service_dir" app.main:app --host 127.0.0.1 --port 8000 &
backend_pid=$!

pnpm --filter @agent-studio/component-forge dev
