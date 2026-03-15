from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from cache import cache_get, cache_set
from services.stream_service import get_stream_url

router = APIRouter()

STREAM_CACHE_TTL = 60 * 60 * 5  # 5 hours


class StreamResponse(BaseModel):
    video_id: str
    stream_url: str
    format: str
    expires_at: str


def _cache_key(video_id: str) -> str:
    return f"stream:{video_id}"


@router.get("/{video_id}", response_model=StreamResponse)
async def stream(video_id: str) -> StreamResponse:
    cache_key = _cache_key(video_id)

    # Check cache first
    cached = await cache_get(cache_key)
    if cached:
        logger.info(f"Cache HIT for stream: {video_id}")
        return StreamResponse(**cached)

    # Cache miss — call yt-dlp
    logger.info(f"Cache MISS for stream: {video_id} — calling yt-dlp")
    result = await get_stream_url(video_id)

    if not result:
        raise HTTPException(
            status_code=422,
            detail={"error": "stream_unavailable", "video_id": video_id},
        )

    response = StreamResponse(
        video_id=result.video_id,
        stream_url=result.stream_url,
        format=result.format,
        expires_at=result.expires_at.isoformat(),
    )

    # Cache it
    await cache_set(cache_key, response.model_dump(), STREAM_CACHE_TTL)
    logger.info(f"Cached stream URL for {video_id} (TTL: 5h)")

    return response
