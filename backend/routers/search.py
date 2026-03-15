from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.search_service import search_tracks

router = APIRouter()


class TrackResponse(BaseModel):
    video_id: str
    title: str
    artist: str
    album: str | None
    duration_ms: int | None
    thumbnail_url: str | None


@router.get("", response_model=list[TrackResponse])
async def search(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Number of results"),
) -> list[TrackResponse]:
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    results = await search_tracks(q.strip(), limit=limit)

    if not results:
        return []

    return [
        TrackResponse(
            video_id=t.video_id,
            title=t.title,
            artist=t.artist,
            album=t.album,
            duration_ms=t.duration_ms,
            thumbnail_url=t.thumbnail_url,
        )
        for t in results
    ]
