# Adio Base FastAPI service

## Local development

```sh
cd apps/adio-base
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Vercel deploys `api/index.py` as the FastAPI entrypoint. The browser must not receive `DATABASE_URL`, `GROQ_API_KEY`, `SUPABASE_JWKS_URL`, or `BACKEND_PROXY_SECRET`. Production traffic should reach this service only through the Next.js same-origin proxy.
