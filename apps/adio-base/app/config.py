import logging
from functools import lru_cache

from pydantic import AnyHttpUrl, Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("adio-base")


class Settings(BaseSettings):
    app_env: str = "development"
    frontend_origin: AnyHttpUrl = "http://localhost:3000"
    frontend_origins: str = ""
    backend_proxy_secret: str = Field(min_length=32)
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    database_url: str
    supabase_url: AnyHttpUrl = "https://fijjgllqqbgdtbvzumpl.supabase.co"
    supabase_anon_key: str = ""
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_issuer: str = ""
    supabase_jwks_url: AnyHttpUrl = "https://fijjgllqqbgdtbvzumpl.supabase.co/auth/v1/.well-known/jwks.json"
    max_generations_per_24h: int = Field(default=10, ge=1)
    max_tokens_per_24h: int = Field(default=100_000, ge=1)
    generation_timeout_seconds: int = Field(default=110, ge=10, le=300)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


def format_settings_errors(exc: ValidationError) -> str:
    parts = []
    for error in exc.errors():
        field = ".".join(str(part) for part in error.get("loc", ()) ) or "unknown"
        parts.append(f"{field} ({error.get('type')}: {error.get('msg')})")
    return "; ".join(parts)


@lru_cache
def get_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as exc:
        logger.error("Backend settings validation failed for: %s", format_settings_errors(exc))
        raise
