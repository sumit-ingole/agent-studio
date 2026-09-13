# Agent Studio Local Testing and Deployment Runbook

This document is the operational guide for the current full-stack architecture.

## 1. Architecture

The application has two separately running services:

```text
Browser
  -> Next.js frontend and same-origin /api proxy routes
  -> FastAPI service
  -> Supabase Auth, Supabase Postgres, and Groq
```

Deployment targets:

- Next.js frontend: Vercel
- FastAPI backend: `adio-base` Python project on Vercel
- Authentication and database: Supabase
- Model provider: Groq, called only by FastAPI

The browser never receives `DATABASE_URL`, `GROQ_API_KEY`, `SUPABASE_JWKS_URL` credentials, or `BACKEND_PROXY_SECRET`.

The older `SETUP_AND_RUN_GUIDE.md` still contains instructions for the previous client-side Groq setup. Use this document instead.

## 2. Prerequisites

Install or verify:

```bash
node --version       # Node 24 or newer
pnpm --version       # pnpm 8.x
python3 --version    # Python 3.12 recommended
```

Install JavaScript dependencies from the repository root:

```bash
pnpm install
```

Create the Python environment once:

```bash
python3 -m venv apps/adio-base/.venv
apps/adio-base/.venv/bin/python -m pip install --upgrade pip
apps/adio-base/.venv/bin/pip install -r apps/adio-base/requirements.txt
```

## 3. Local Environment

Create the files if they do not exist:

7. Deploy after `adio-base` is healthy.
   cp apps/adio-base/.env.example apps/adio-base/.env
   cp apps/component-forge/.env.example apps/component-forge/.env.local
   chmod 600 apps/adio-base/.env apps/component-forge/.env.local

````

### 3.1 Backend local values

`apps/adio-base/.env` must contain values similar to:

```env
APP_ENV=development
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_ORIGINS=http://localhost:3000
BACKEND_PROXY_SECRET=long-random-value
GROQ_API_KEY=server-only-groq-key
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL=postgresql://user:password@pooler-host.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://fijjgllqqbgdtbvzumpl.supabase.co
SUPABASE_ANON_KEY=supabase-publishable-key
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWT_ISSUER=https://fijjgllqqbgdtbvzumpl.supabase.co/auth/v1
SUPABASE_JWKS_URL=https://fijjgllqqbgdtbvzumpl.supabase.co/auth/v1/.well-known/jwks.json
MAX_GENERATIONS_PER_24H=10
MAX_TOKENS_PER_24H=100000
GENERATION_TIMEOUT_SECONDS=110
````

Use the Supabase Session Pooler URI from:

`Supabase Dashboard -> Connect -> Database -> Connection string -> URI -> Session pooler`

The value can start with `postgresql://`; the FastAPI SQLAlchemy setup converts it to `postgresql+asyncpg://` and requires TLS.

### 3.2 Frontend local values

`apps/component-forge/.env.local` must contain:

5. Vercel builds and deploys the `adio-base` Python function.
   BACKEND_API_URL=http://localhost:8000
   BACKEND_PROXY_SECRET=the-same-value-used-by-backend
   NEXT_PUBLIC_APP_URL=http://localhost:3000

````

Only `NEXT_PUBLIC_APP_URL` is intended for browser exposure. Never prefix backend secrets with `NEXT_PUBLIC_`.

## 4. Local Run Modes

### Mode A: Local UI with deployed FastAPI

Use this when testing the local frontend against the deployed Vercel `adio-base` backend:

```bash
pnpm dev:ui:prod-api
````

The command asks for:

1. The deployed `adio-base` Vercel HTTPS URL.
2. The production `BACKEND_PROXY_SECRET`, hidden while typing.

It does not write those values to a file. The browser still calls localhost Next.js routes; Next.js forwards requests to `adio-base`.

Use this mode to test frontend changes against production-like authentication, database, quota, and model behavior. Confirm the deployed backend allows the Vercel origin and that its proxy secret matches the value entered into the command.

### Mode B: Local UI and local FastAPI

Use this for normal full-stack development:

```bash
pnpm dev:local
```

Use the Vercel deployment history for the `adio-base` project and promote the last known-good deployment.

- Next.js at `http://localhost:3000`
- FastAPI at `http://127.0.0.1:8000`

The script loads `apps/adio-base/.env`, clears stale shell `DATABASE_URL` values, and stops FastAPI when the frontend process exits.

Open: 3. Update `adio-base` Vercel secrets.

- Home: `http://localhost:3000`
- Authentication: `http://localhost:3000/auth`
- Profile: `http://localhost:3000/profile`
- Component Forge: `http://localhost:3000/apps/component-forge`
- FastAPI health: `http://127.0.0.1:8000/health`

### Mode C: FastAPI only

Use this for backend work:

```bash
pnpm dev:backend
```

FastAPI runs at `http://127.0.0.1:8000`.

### Manual startup

If a script is not suitable:

Terminal 1:

```bash
env -u DATABASE_URL apps/adio-base/.venv/bin/uvicorn \
  --env-file apps/adio-base/.env \
  --app-dir apps/adio-base \
  app.main:app \
  --host 127.0.0.1 \
  --port 8000
```

Terminal 2:

```bash
pnpm dev:component-forge
```

## 5. Local Smoke Test

Run these checks after starting both services:

```bash
# Frontend responds
curl -I http://localhost:3000

# FastAPI health is public
curl http://127.0.0.1:8000/health

# Backend proxy secret is required
curl -i http://127.0.0.1:8000/ready

# Use the configured secret without printing it
proxy_secret=$(awk -F= '/^BACKEND_PROXY_SECRET=/ {print substr($0, index($0, "=")+1)}' apps/adio-base/.env)
curl -i -H "X-Backend-Proxy-Secret: $proxy_secret" http://127.0.0.1:8000/ready

# A protected route requires a user session
curl -i -H "X-Backend-Proxy-Secret: $proxy_secret" http://127.0.0.1:8000/profile
```

Expected results:

- Frontend: HTTP 200.
- `/health`: HTTP 200 and `{"status":"ok"}`.
- `/ready` without the secret: HTTP 403.
- `/ready` with the secret: HTTP 200.
- `/profile` without a session: HTTP 401.

## 6. Authentication Test Checklist

Test from `http://localhost:3000/auth`:

1. Switch to Sign up.
2. Submit an invalid email and confirm a validation message appears without a request being sent.
3. Enter a password shorter than 8 characters and confirm it is rejected.
4. Enter a password without a number and confirm it is rejected.
5. Enter an optional mobile number with the country code selector and invalid digits; confirm it is rejected.
6. Submit valid full name, email, password, and optional mobile.
7. Confirm the UI stays on the auth page and says the account was created successfully.
8. Sign in with the new account.
9. Confirm redirect to the originally requested destination.
10. Confirm the profile page shows the account and quota values.
11. Test Google and GitHub only after provider credentials and redirect URLs are configured in Supabase.

## 7. Component Forge Test Checklist

After signing in:

1. Open Component Forge.
2. Submit a valid React component request.
3. Confirm processing events appear progressively.
4. Confirm generated files and preview appear.
5. Download the ZIP and inspect its filenames.
6. Confirm the profile page shows the prompt and token usage.
7. Submit invalid or too-short input and confirm client validation.
8. Test a user without a session and confirm generation is rejected.
9. Test quota behavior in a controlled environment by temporarily lowering `MAX_GENERATIONS_PER_24H`.
10. Test HTML generation separately from React generation.

## 8. Database Verification

The initial migration is:

```text
apps/adio-base/migrations/001_initial.sql
```

Apply it in Supabase SQL Editor before using a new database. Verify tables:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'app_users',
    'generation_operations',
    'generation_prompts',
    'generation_files'
  )
order by tablename;
```

Verify the main usage index:

```sql
explain (analyze, buffers)
select count(*), coalesce(sum(total_tokens), 0)
from generation_operations
where user_id = 'USER_UUID'
  and created_at >= now() - interval '24 hours';
```

Never run destructive migration statements directly in production without a backup and rollback plan.

## 9. Quality Checks Before Deployment

Run from the repository root:

```bash
pnpm format:check
pnpm lint
pnpm type-check
pnpm build
python3 -m compileall -q apps/adio-base/app
zsh -n scripts/dev-ui-prod-api.sh scripts/dev-local.sh scripts/dev-backend.sh
```

The existing monorepo may report TypeScript project-reference warnings. The production Next build is the required frontend integration check.

For a backend dependency check:

```bash
apps/adio-base/.venv/bin/pip check
```

## 10. Deploy FastAPI to Vercel as adio-base

FastAPI is deployed as a separate Vercel project named `adio-base`. The project root is `apps/adio-base`, the Python entrypoint is `api/index.py`, and the project configuration is `apps/adio-base/vercel.json`.

### 10.1 First-time adio-base setup

1. Push the repository to the connected Git provider.
2. In Vercel, choose **Add New -> Project**.
3. Select the same repository.
4. Set the project name to `adio-base`.
5. Set the project root to `apps/adio-base`.
6. Let Vercel detect the Python function under `api/index.py`.
7. Add the environment variables below to the `adio-base` project.
8. Deploy and copy the resulting HTTPS service URL.

The Vercel project must support the configured 120-second function duration. If the account plan enforces a shorter maximum, reduce `GENERATION_TIMEOUT_SECONDS` and the `maxDuration` value, or use a plan that supports the existing generation timeout.

### 10.2 adio-base Vercel environment variables

Set:

```env
APP_ENV=production
FRONTEND_ORIGIN=https://adio-agents.vercel.app
FRONTEND_ORIGINS=https://adio-agents.vercel.app
BACKEND_PROXY_SECRET=long-random-production-value
DATABASE_URL=Supabase-session-pooler-uri
GROQ_API_KEY=server-only-groq-key
SUPABASE_ANON_KEY=Supabase-publishable-key
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWT_ISSUER=https://fijjgllqqbgdtbvzumpl.supabase.co/auth/v1
SUPABASE_JWKS_URL=https://fijjgllqqbgdtbvzumpl.supabase.co/auth/v1/.well-known/jwks.json
```

These variables belong in the `adio-base` Vercel project. They are server-side and must not use the `NEXT_PUBLIC_` prefix.

### 10.3 Verify adio-base

```bash
curl https://adio-base.vercel.app/health
```

The response should be:

```json
{ "status": "ok" }
```

`/ready` requires the proxy secret and should not be tested by placing the secret in a shared command history or chat message.

## 11. Deploy Next.js to Vercel

### 11.1 First-time Vercel setup

1. Import the repository into Vercel.
2. Keep the project root at the repository root.
3. Use the repository `vercel.json` configuration.
4. Confirm the framework is Next.js.
5. Confirm install command:

```text
pnpm install --frozen-lockfile
```

6. Confirm build command:

```text
pnpm build
```

7. Add the environment variables below.
8. Deploy after `adio-base` is healthy.

### 11.2 Vercel environment variables

For Production, Preview, and Development as appropriate:

```env
BACKEND_API_URL=https://adio-base.vercel.app
BACKEND_PROXY_SECRET=the-same-value-used-in-adio-base
NEXT_PUBLIC_APP_URL=https://adio-agents.vercel.app
```

`BACKEND_API_URL` and `BACKEND_PROXY_SECRET` are server-side Next.js variables. Do not rename them with `NEXT_PUBLIC_`.

### 11.3 Supabase Auth URLs

In Supabase Authentication URL configuration, allow:

```text
https://adio-agents.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

For Google and GitHub providers, configure their client credentials in Supabase and use the Supabase callback URL shown in the provider settings. Do not put OAuth client secrets in Vercel frontend variables.

## 12. Deploying Changes

The GitHub Actions workflow `.github/workflows/deploy.yml` deploys both Vercel projects after a successful `main` push. Configure these GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID` for the Next.js frontend
- `VERCEL_ADIO_BASE_PROJECT_ID` for the `adio-base` FastAPI project

Vercel project environment variables remain configured in Vercel. GitHub Actions secrets only authenticate the deployment commands.

### Frontend-only change

1. Run the local frontend checks.
2. Test with `pnpm dev:local`.
3. Commit and push the branch.
4. Vercel creates a Preview deployment.
5. Test the preview using the preview backend configuration or the deployed API mode.
6. Merge to the production branch.
7. Vercel deploys production automatically.

### Backend-only change

1. Run `python3 -m compileall -q apps/adio-base/app`.
2. Run backend tests and database checks.
3. Test with `pnpm dev:local`.
4. Push the branch.
5. Vercel builds and deploys the `adio-base` Python function.
6. Wait for `/health` to become healthy.
7. Test auth, profile, generation, quota, and database behavior.

### Shared contract or database change

1. Add a backward-compatible backend change first.
2. Add and test the migration in a non-production Supabase project.
3. Apply the production migration during a controlled window.
4. Deploy `adio-base`.
5. Deploy the frontend that uses the new contract.
6. Remove compatibility code only after all clients are updated.

### Prompt or generation change

1. Test React and HTML generation locally.
2. Confirm SSE processing, success, and error events.
3. Check generated-file validation and ZIP download.
4. Deploy `adio-base` because the model call is backend-owned.
5. Test the production generation flow and token accounting.

## 13. Safe Migration Procedure

For a schema change:

1. Back up or verify Supabase Point-in-Time Recovery settings.
2. Write a new numbered migration file; do not edit an already-applied migration.
3. Apply the migration to a staging database.
4. Run the affected queries and `EXPLAIN` checks.
5. Deploy compatible FastAPI code.
6. Apply the production migration.
7. Deploy the frontend if needed.
8. Verify the health, auth, profile, and generation flows.

## 14. Rollback

### Vercel rollback

Use the Vercel deployment history and promote the last known-good deployment.

### adio-base rollback

Use the Vercel deployment history for the `adio-base` project and promote the last known-good deployment.

### Database rollback

Prefer forward-fix migrations. Do not automatically drop columns or tables. Restore from backup only after confirming the data impact and maintenance window.

### Secret rotation

1. Create the replacement Groq key or Supabase database password.
2. Update `adio-base` Vercel secrets.
3. Update local ignored files separately.
4. Redeploy FastAPI.
5. Verify `/health`, database access, auth, and generation.
6. Revoke the old credential.

## 15. Production Smoke Test

After every production release:

```bash
curl -fsS https://adio-base.vercel.app/health
curl -fsS https://adio-agents.vercel.app/
curl -sS -o /dev/null -w '%{http_code}\n' https://adio-agents.vercel.app/api/backend-health
```

Then manually verify:

- Signup validation.
- Account-created message without an email-confirmation step.
- Sign-in and destination redirect.
- Profile quota display.
- Component generation SSE progress.
- Generated preview and ZIP download.
- Unauthorized profile/generation behavior.
- Prompt and token persistence.
- Quota rejection behavior.

## 16. Security Rules

- Never commit `.env`, `.env.local`, database URLs, model keys, JWT signing material, or proxy secrets.
- Never use `NEXT_PUBLIC_GROQ_API_KEY`.
- Never expose the Supabase database connection string to the browser.
- Use separate secrets for local and production.
- Rotate any credential pasted into chat, source control, logs, or an issue.
- Keep `BACKEND_PROXY_SECRET` identical only between the frontend Vercel project and the `adio-base` Vercel project.
- Keep `adio-base` `FRONTEND_ORIGIN` and `FRONTEND_ORIGINS` limited to the actual Vercel production origin.
- Add preview origins only when deliberately testing preview deployments.
- Disable Supabase Email confirmation for this product flow, and use strong password validation plus rate limiting as the account-entry guardrail.
- Treat generated code as untrusted browser content; preview sandbox hardening remains a separate security task.
