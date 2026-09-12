#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."

read -r "backend_url?Production adio-base Vercel URL (for example https://adio-base.vercel.app): "
if [[ -z "$backend_url" || "$backend_url" != https://* ]]; then
  print -u2 "A valid HTTPS FastAPI URL is required."
  exit 1
fi
read -r -s "proxy_secret?Production BACKEND_PROXY_SECRET (hidden): "
printf '\n'
if [[ -z "$proxy_secret" ]]; then
  print -u2 "A proxy secret is required."
  exit 1
fi

BACKEND_API_URL="$backend_url" BACKEND_PROXY_SECRET="$proxy_secret" NEXT_PUBLIC_APP_URL=http://localhost:3000 pnpm --filter @agent-studio/component-forge dev
