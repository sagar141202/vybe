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


@router.post("/index/build")
async def build_annoy_index() -> dict:
    """Build Annoy similarity index from all tracks with features."""
    from services.annoy_service import build_index

    result = await build_index()
    return result


@router.get("/similar")
async def get_similar_tracks(limit: int = 20) -> list:
    """Get similar tracks using Annoy index + user vector."""
    from services.annoy_service import query_similar
    from services.recommendation_service import compute_user_vector

    user_vector = await compute_user_vector()
    if not user_vector:
        return []

    results = query_similar(user_vector, n=limit)
    return results
