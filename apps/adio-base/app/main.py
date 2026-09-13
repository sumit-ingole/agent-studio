import os
import logging

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .config import Settings, get_settings
from .routes import auth_router, generate_router, profile_router

logger = logging.getLogger(__name__)


def require_proxy_secret(
    x_backend_proxy_secret: str | None = Header(default=None),
) -> None:
    try:
        configured_secret = get_settings().backend_proxy_secret
    except ValidationError as exc:
        fields = ", ".join(str(error.get("loc", ["unknown"])[0]) for error in exc.errors())
        logger.error("Backend settings validation failed for: %s", fields)
        raise HTTPException(status_code=503, detail="Backend configuration is incomplete") from exc
    if not x_backend_proxy_secret or x_backend_proxy_secret != configured_secret:
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


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", dependencies=[Depends(require_proxy_secret)])
async def ready() -> dict[str, str]:
    return {"status": "ready"}


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": "Request rejected", "message": exc.detail})
