from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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


@lru_cache
def get_settings() -> Settings:
    return Settings()
