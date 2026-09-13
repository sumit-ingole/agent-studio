from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import get_settings

session_factory = None


async def get_session() -> AsyncIterator[AsyncSession]:
    global session_factory
    if session_factory is None:
        database_url = get_settings().database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        engine = create_async_engine(
            database_url,
            connect_args={"ssl": "require"},
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=5,
        )
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
