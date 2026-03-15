from fastapi import APIRouter, Query
from loguru import logger
from pydantic import BaseModel

from cache import cache_get, cache_set
from config import settings
from database import AsyncSessionLocal
from models import Track
from services.genius_service import get_lyrics_genius
from services.lyrics_service import get_lyrics_lrclib, search_lyrics_lrclib

router = APIRouter()

LYRICS_CACHE_TTL = 60 * 60 * 24 * 30


class LyricsLine(BaseModel):
    time_ms: int
    text: str


class LyricsResponse(BaseModel):
    video_id: str
    lines: list[LyricsLine]
    synced: bool
    source: str
    genius_url: str | None = None


async def _get_track_info(video_id: str) -> tuple[str, str, str | None]:
    try:
        async with AsyncSessionLocal() as session:
            track = await session.get(Track, video_id)
            if track:
                return track.artist, track.title, track.album
    except Exception:
        pass
    return "Unknown", "Unknown", None


@router.get("/{video_id}", response_model=LyricsResponse)
async def get_lyrics(
    video_id: str,
    artist: str = Query(default=None),
    title: str = Query(default=None),
) -> LyricsResponse:
    cache_key = f"lyrics:{video_id}"

    cached = await cache_get(cache_key)
    if cached:
        logger.info(f"Cache HIT for lyrics: {video_id}")
        return LyricsResponse(**cached)

    if not artist or not title:
        artist, title, album = await _get_track_info(video_id)
    else:
        album = None

    logger.info(f"Fetching lyrics: {artist} - {title}")

    result = await get_lyrics_lrclib(artist, title, album)

    if not result:
        result = await search_lyrics_lrclib(artist, title)

    if not result and settings.genius_access_token:
        result = await get_lyrics_genius(artist, title, settings.genius_access_token)

    if not result:
        result = {
            "lines": [{"time_ms": 0, "text": "Lyrics not available for this track."}],
            "synced": False,
            "source": "none",
        }

    response = LyricsResponse(
        video_id=video_id,
        lines=[LyricsLine(**line) for line in result["lines"]],
        synced=result.get("synced", False),
        source=result.get("source", "none"),
        genius_url=result.get("genius_url"),
    )

    await cache_set(cache_key, response.model_dump(), LYRICS_CACHE_TTL)
    return response
