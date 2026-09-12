from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException, Request

from .config import Settings, get_settings
from .schemas import SigninRequest, SignupRequest


def _token_from_request(request: Request) -> str | None:
    return request.cookies.get("access_token") or request.headers.get("Authorization", "").removeprefix("Bearer ").strip() or None


def current_user(request: Request, settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    token = _token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        jwks_client = jwt.PyJWKClient(str(settings.supabase_jwks_url))
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=settings.supabase_jwt_audience,
            issuer=settings.supabase_jwt_issuer,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid session") from exc


async def supabase_auth(path: str, payload: dict[str, Any], settings: Settings) -> dict[str, Any]:
    anon_key = getattr(settings, "supabase_anon_key", "")
    if not anon_key:
        raise HTTPException(status_code=503, detail="Authentication is not configured")
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(f"{str(settings.supabase_url).rstrip('/')}/auth/v1/{path}", json=payload, headers={"apikey": anon_key, "Content-Type": "application/json"})
    if response.status_code >= 400:
        provider_message = response.json().get("msg", "") if response.headers.get("content-type", "").startswith("application/json") else ""
        if "confirm" in provider_message.lower() or "email" in provider_message.lower() and "verified" in provider_message.lower():
            raise HTTPException(status_code=401, detail="Confirm your email address before signing in.")
        raise HTTPException(status_code=400, detail="Authentication request failed. Check your details and try again.")
    return response.json()


async def signup(data: SignupRequest, settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    result = await supabase_auth("signup", {"email": data.email, "password": data.password, "data": {"full_name": data.full_name, "mobile": data.mobile}}, settings)
    return {
        "user": result.get("user"),
        "session": result.get("session"),
        "requires_email_confirmation": result.get("session") is None,
    }


async def signin(data: SigninRequest, settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    return await supabase_auth("token?grant_type=password", data.model_dump(), settings)


async def signout(request: Request, settings: Settings) -> None:
    token = _token_from_request(request)
    if not token:
        return
    anon_key = settings.supabase_anon_key
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{str(settings.supabase_url).rstrip('/')}/auth/v1/logout",
            headers={"apikey": anon_key, "Authorization": f"Bearer {token}"},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=400, detail="Unable to sign out")
