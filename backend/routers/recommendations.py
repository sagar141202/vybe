from fastapi import APIRouter
from pydantic import BaseModel

from services.recommendation_service import compute_user_vector, get_recommendations

router = APIRouter()


class UserVector(BaseModel):
    bpm: float
    energy: float
    spectral_centroid: float
    valence: float
    danceability: float
    preferred_key: str | None
    play_count: int
    unique_tracks: int


@router.get("/vector")
async def get_user_vector() -> dict:
    """Get the computed user taste vector."""
    vector = await compute_user_vector()
    if not vector:
        return {"status": "insufficient_data", "message": "Play more tracks to get recommendations"}
    return {"status": "ok", "vector": vector}


@router.get("/tracks")
async def get_recommended_tracks(limit: int = 20) -> list:
    """Get recommended tracks based on user listening history."""
    recs = await get_recommendations(limit=limit)
    if not recs:
        return []
    return recs
