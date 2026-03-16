from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class VibeQuery(BaseModel):
    query: str
    limit: int = 20
    search_youtube: bool = True


@router.post("/search")
async def vibe_search(body: VibeQuery) -> list:
    """Semantic vibe search — find tracks matching a mood/vibe description."""
    from services.vibe_service import vibe_search

    return await vibe_search(
        query=body.query,
        limit=body.limit,
        search_youtube=body.search_youtube,
    )


@router.post("/index/build")
async def build_vibe_index() -> dict:
    """Build semantic embeddings index."""
    from services.vibe_service import build_vibe_index

    return await build_vibe_index()


@router.get("/suggestions")
async def get_vibe_suggestions() -> list:
    """Pre-defined vibe suggestions for the UI."""
    return [
        {"label": "Rainy night lo-fi", "emoji": "🌧️", "query": "rainy night lofi chill study"},
        {"label": "Workout pump", "emoji": "💪", "query": "high energy workout pump up intense"},
        {"label": "Late night drive", "emoji": "🚗", "query": "late night drive dark atmospheric"},
        {"label": "Morning coffee", "emoji": "☕", "query": "peaceful morning calm acoustic"},
        {"label": "Party banger", "emoji": "🎉", "query": "party dance upbeat energetic happy"},
        {"label": "Heartbreak", "emoji": "💔", "query": "sad emotional heartbreak melancholic"},
        {
            "label": "Focus deep work",
            "emoji": "🎯",
            "query": "focus concentration instrumental ambient",
        },
        {"label": "Summer vibes", "emoji": "🌊", "query": "summer beach happy uplifting tropical"},
        {"label": "Midnight feels", "emoji": "🌙", "query": "midnight dark moody introspective"},
        {"label": "Road trip", "emoji": "🛣️", "query": "road trip feel good sing along"},
    ]
