import asyncio
import json
from collections.abc import AsyncIterator
from uuid import uuid4

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import current_user
from ..config import Settings, get_settings
from ..db import get_session
from ..generation import generate, timestamp
from ..schemas import GenerationRequest

router = APIRouter(prefix="/generate", tags=["generation"])


@router.post("/component")
async def generate_component(
    data: GenerationRequest,
    user: dict = Depends(current_user),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_session),
):
    async def events() -> AsyncIterator[str]:
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        async def emit(event: dict) -> None:
            event.setdefault("timestamp", timestamp())
            await queue.put(f"data: {json.dumps(event)}\n\n")

        async def run_generation() -> None:
            try:
                usage = await session.execute(
                    text("""
                        select count(*)::int as generations, coalesce(sum(total_tokens), 0)::int as tokens
                        from generation_operations
                        where user_id = :user_id and created_at >= now() - interval '24 hours'
                    """),
                    {"user_id": user.get("sub")},
                )
                usage_row = usage.mappings().one()
                if usage_row["generations"] >= settings.max_generations_per_24h or usage_row["tokens"] >= settings.max_tokens_per_24h:
                    await emit({"type": "error", "error": "Rate limit exceeded", "message": "Your 24-hour generation limit has been reached.", "status": 429})
                    return
                await emit({"type": "processing", "message": "Analyzing requirements..."})
                files, tokens = await generate(settings, data.framework, data.requirement, data.componentName, data.features, emit)
                operation_id = uuid4()
                await session.execute(
                    text("""
                        insert into app_users (id, full_name) values (:user_id, :full_name)
                        on conflict (id) do nothing
                    """),
                    {"user_id": user.get("sub"), "full_name": user.get("user_metadata", {}).get("full_name", "")},
                )
                await session.execute(
                    text("""
                        insert into generation_operations
                          (id, user_id, requirement, framework, component_name, status, total_tokens, completed_at)
                        values (:id, :user_id, :requirement, :framework, :component_name, 'completed', :tokens, now())
                    """),
                    {"id": operation_id, "user_id": user.get("sub"), "requirement": data.requirement, "framework": data.framework, "component_name": data.componentName, "tokens": tokens},
                )
                await session.execute(
                    text("insert into generation_prompts (operation_id, user_id, prompt) values (:operation_id, :user_id, :prompt)"),
                    {"operation_id": operation_id, "user_id": user.get("sub"), "prompt": data.requirement},
                )
                for filename, content in files.items():
                    await session.execute(
                        text("insert into generation_files (operation_id, filename, content) values (:operation_id, :filename, :content)"),
                        {"operation_id": operation_id, "filename": filename, "content": content},
                    )
                await session.commit()
                await emit({"type": "success", "data": {"success": True, "componentName": data.componentName, "framework": data.framework, "files": files, "timestamp": timestamp(), "tokenUsage": tokens, "userId": user.get("sub")}})
            except Exception:
                await session.rollback()
                await emit({"type": "error", "error": "Generation failed", "message": "We could not create a working component from that request.", "status": 422})
            finally:
                await queue.put(None)

        task = asyncio.create_task(run_generation())
        try:
            while True:
                event = await queue.get()
                if event is None:
                    break
                yield event
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
