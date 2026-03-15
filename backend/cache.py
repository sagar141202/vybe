import json
from typing import Any

import redis.asyncio as aioredis

from config import settings

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def cache_get(key: str) -> Any | None:
    """Return parsed JSON value or None on miss."""
    r = get_redis()
    value = await r.get(key)
    if value is None:
        return None
    return json.loads(value)


async def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    """Serialise value as JSON and store with TTL."""
    r = get_redis()
    await r.setex(key, ttl_seconds, json.dumps(value))


async def cache_delete(key: str) -> None:
    r = get_redis()
    await r.delete(key)


async def cache_exists(key: str) -> bool:
    r = get_redis()
    return bool(await r.exists(key))
