import logging
import os
import sys

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .config import Settings, format_settings_errors, get_settings
from .routes import auth_router, generate_router, profile_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
    force=True,
)
logger = logging.getLogger("adio-base")


def _runtime_log(message: str, *, level: int = logging.INFO) -> None:
    logger.log(level, message)
    print(f"[adio-base] {message}", flush=True)


def require_proxy_secret(
    x_backend_proxy_secret: str | None = Header(default=None),
) -> None:
    try:
        configured_secret = get_settings().backend_proxy_secret
    except ValidationError as exc:
        _runtime_log(
            f"Backend settings validation failed for: {format_settings_errors(exc)}",
            level=logging.ERROR,
        )
        raise HTTPException(status_code=503, detail="Backend configuration is incomplete") from exc
    if not x_backend_proxy_secret or x_backend_proxy_secret != configured_secret:
        _runtime_log(
            "Proxy secret rejected: header_present=%s header_len=%s configured_len=%s"
            % (
                bool(x_backend_proxy_secret),
                len(x_backend_proxy_secret or ""),
                len(configured_secret),
            ),
            level=logging.WARNING,
        )
        raise HTTPException(status_code=403, detail="Forbidden")


allowed_origins = [
    origin.strip().rstrip("/")
    for origin in (
        os.getenv("FRONTEND_ORIGINS") or os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    ).split(",")
    if origin.strip()
]
app = FastAPI(
    title="Agent Studio API",
    version="1.0.0",
    docs_url=None if os.getenv("APP_ENV", "development") == "production" else "/docs",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Backend-Proxy-Secret", "Authorization"],
)
app.include_router(auth_router, dependencies=[Depends(require_proxy_secret)])
app.include_router(generate_router, dependencies=[Depends(require_proxy_secret)])
app.include_router(profile_router, dependencies=[Depends(require_proxy_secret)])


@app.on_event("startup")
async def log_runtime_config() -> None:
    env_keys = (
        "APP_ENV",
        "FRONTEND_ORIGIN",
        "FRONTEND_ORIGINS",
        "BACKEND_PROXY_SECRET",
        "DATABASE_URL",
        "GROQ_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_JWT_AUDIENCE",
        "SUPABASE_JWT_ISSUER",
        "SUPABASE_JWKS_URL",
    )
    presence = []
    for key in env_keys:
        value = os.getenv(key)
        if key == "BACKEND_PROXY_SECRET":
            presence.append(f"{key}=set:{bool(value)} len:{len(value or '')}")
        else:
            presence.append(f"{key}=set:{bool(value)}")
    _runtime_log("startup env presence: " + ", ".join(presence))
    try:
        get_settings()
        _runtime_log("startup settings loaded")
    except ValidationError as exc:
        _runtime_log(
            f"startup settings invalid: {format_settings_errors(exc)}",
            level=logging.ERROR,
        )


@app.middleware("http")
async def origin_guard(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin and origin.rstrip("/") not in allowed_origins:
        return JSONResponse(status_code=403, content={"error": "Request rejected", "message": "Origin is not allowed"})
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.middleware("http")
async def request_log(request: Request, call_next):
    _runtime_log(
        f"{request.method} {request.url.path} origin_present={bool(request.headers.get('origin'))} "
        f"proxy_header_present={bool(request.headers.get('x-backend-proxy-secret'))}"
    )
    response = await call_next(request)
    _runtime_log(f"{request.method} {request.url.path} status={response.status_code}")
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", dependencies=[Depends(require_proxy_secret)])
async def ready() -> dict[str, str]:
    return {"status": "ready"}


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": "Request rejected", "message": exc.detail})
