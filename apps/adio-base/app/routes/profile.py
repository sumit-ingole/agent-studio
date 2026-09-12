from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import current_user
from ..config import Settings, get_settings
from ..db import get_session

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("")
async def profile(
    user: dict = Depends(current_user),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_session),
):
    user_id = user.get("sub")
    usage = await session.execute(
        text("""
            select count(*)::int as generations, coalesce(sum(total_tokens), 0)::int as tokens
            from generation_operations
            where user_id = :user_id and created_at >= now() - interval '24 hours'
        """),
        {"user_id": user_id},
    )
    prompts = await session.execute(
        text("""
            select id, prompt, created_at
            from generation_prompts
            where user_id = :user_id
            order by created_at desc
            limit 3
        """),
        {"user_id": user_id},
    )
    usage_row = usage.mappings().one()
    return {
        "user": {"id": user_id, "email": user.get("email"), "fullName": user.get("user_metadata", {}).get("full_name", "")},
        "usage24h": {"generations": usage_row["generations"], "tokens": usage_row["tokens"]},
        "limits": {"generations": settings.max_generations_per_24h, "tokens": settings.max_tokens_per_24h},
        "prompts": [dict(row) for row in prompts.mappings().all()],
    }
