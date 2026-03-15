from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel

from cache import cache_get, cache_set
from config import settings
from database import AsyncSessionLocal
from models import Track
from services.coverart_service import get_cover_art
from services.lastfm_service import get_album_art, get_artist_image
from services.musicbrainz_service import lookup_track
from services.search_service import search_tracks

router = APIRouter()

METADATA_CACHE_TTL = 60 * 60 * 24 * 7  # 7 days


class MetadataResponse(BaseModel):
    video_id: str
    title: str
    artist: str
    album: str | None
    year: int | None
    cover_art_small: str | None
    cover_art_large: str | None
    artist_mbid: str | None
    album_mbid: str | None


async def _fetch_fresh_metadata(video_id: str) -> MetadataResponse:
    """Fetch metadata from external APIs and return response."""
    title = "Unknown"
    artist = "Unknown"
    album = None

    search_results = await search_tracks(video_id, limit=1)
    if search_results:
        track = search_results[0]
        title = track.title
        artist = track.artist
        album = track.album

    mb_result = await lookup_track(artist, title)
    artist_mbid = mb_result.artist_mbid if mb_result else None
    album_mbid = mb_result.album_mbid if mb_result else None
    year = mb_result.year if mb_result else None
    if mb_result and mb_result.album:
        album = mb_result.album

    cover_small = None
    cover_large = None

    if album_mbid:
        art = await get_cover_art(album_mbid)
        if art:
            cover_small = art.get("small")
            cover_large = art.get("large")

    if not cover_large and settings.lastfm_api_key:
        if album:
            lastfm_art = await get_album_art(artist, album, settings.lastfm_api_key)
            if lastfm_art:
                cover_small = lastfm_art
                cover_large = lastfm_art

    if not cover_large and settings.lastfm_api_key:
        artist_img = await get_artist_image(artist, settings.lastfm_api_key)
        if artist_img:
            cover_small = artist_img
            cover_large = artist_img

    return MetadataResponse(
        video_id=video_id,
        title=title,
        artist=artist,
        album=album,
        year=year,
        cover_art_small=cover_small,
        cover_art_large=cover_large,
        artist_mbid=artist_mbid,
        album_mbid=album_mbid,
    )


async def _save_to_postgres(response: MetadataResponse) -> None:
    """Upsert track metadata into Postgres tracks table."""
    async with AsyncSessionLocal() as session:
        existing = await session.get(Track, response.video_id)
        if existing:
            existing.title = response.title
            existing.artist = response.artist
            existing.album = response.album
            existing.thumbnail_url = response.cover_art_large
        else:
            track = Track(
                video_id=response.video_id,
                title=response.title,
                artist=response.artist,
                album=response.album,
                thumbnail_url=response.cover_art_large,
            )
            session.add(track)
        await session.commit()
    logger.info(f"Saved metadata to Postgres for {response.video_id}")


async def _load_from_postgres(video_id: str) -> MetadataResponse | None:
    """Try to load track metadata from Postgres."""
    async with AsyncSessionLocal() as session:
        track = await session.get(Track, video_id)
        if not track:
            return None
        return MetadataResponse(
            video_id=track.video_id,
            title=track.title,
            artist=track.artist,
            album=track.album,
            year=None,
            cover_art_small=track.thumbnail_url,
            cover_art_large=track.thumbnail_url,
            artist_mbid=None,
            album_mbid=None,
        )


@router.get("/{video_id}", response_model=MetadataResponse)
async def get_metadata(video_id: str) -> MetadataResponse:
    # 1. Redis cache (fastest)
    cache_key = f"metadata:{video_id}"
    cached = await cache_get(cache_key)
    if cached:
        logger.info(f"Redis HIT for metadata: {video_id}")
        return MetadataResponse(**cached)

    # 2. Postgres cache (second fastest)
    pg_result = await _load_from_postgres(video_id)
    if pg_result:
        logger.info(f"Postgres HIT for metadata: {video_id}")
        await cache_set(cache_key, pg_result.model_dump(), METADATA_CACHE_TTL)
        return pg_result

    # 3. Fetch from external APIs
    logger.info(f"Cache MISS for metadata: {video_id} — fetching from APIs")
    response = await _fetch_fresh_metadata(video_id)

    # Save to both caches
    await _save_to_postgres(response)
    await cache_set(cache_key, response.model_dump(), METADATA_CACHE_TTL)

    return response
