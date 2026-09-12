from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import urlencode

from ..auth import signout, signin, signup
from ..config import Settings, get_settings
from ..db import get_session
from ..schemas import SigninRequest, SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup_route(
    data: SignupRequest,
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_session),
):
    result = await signup(data, settings)
    user = result.get("user") or {}
    user_id = user.get("id")
    if user_id:
        await session.execute(
            text("""
                insert into app_users (id, full_name, mobile)
                values (:id, :full_name, :mobile)
                on conflict (id) do update set
                  full_name = excluded.full_name,
                  mobile = excluded.mobile,
                  updated_at = now()
            """),
            {"id": user_id, "full_name": data.full_name, "mobile": data.mobile},
        )
        await session.commit()
    return result


@router.post("/signin")
async def signin_route(data: SigninRequest, settings: Settings = Depends(get_settings)):
    return await signin(data, settings)


@router.post("/signout", status_code=204)
async def signout_route(request: Request, settings: Settings = Depends(get_settings)):
    await signout(request, settings)


@router.get("/oauth/{provider}")
async def oauth_route(provider: str, settings: Settings = Depends(get_settings)):
    if provider not in {"google", "github"}:
        return {"error": "Unsupported OAuth provider"}
    redirect_to = f"{str(settings.frontend_origin).rstrip('/')}/auth/callback"
    query = urlencode({"provider": provider, "redirect_to": redirect_to})
    return RedirectResponse(f"{str(settings.supabase_url).rstrip('/')}/auth/v1/authorize?{query}")
