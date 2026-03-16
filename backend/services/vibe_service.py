import numpy as np
from loguru import logger

# Lazy load model to avoid startup slowdown
_model = None
_track_embeddings: dict[str, np.ndarray] = {}


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading sentence-transformers model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Model loaded")
    return _model


def _embed(text: str) -> np.ndarray:
    model = _get_model()
    return model.encode(text, normalize_embeddings=True)


def _track_text(track) -> str:
    """Build a rich text description of a track for embedding."""
    parts = [track.title, track.artist]
    if track.album:
        parts.append(track.album)
    # Add audio feature descriptions
    if track.bpm:
        if track.bpm < 80:
            parts.append("slow tempo chill")
        elif track.bpm < 110:
            parts.append("moderate tempo")
        elif track.bpm < 140:
            parts.append("upbeat energetic")
        else:
            parts.append("fast high energy intense")
    if track.energy:
        if track.energy < 0.1:
            parts.append("calm quiet peaceful ambient")
        elif track.energy < 0.2:
            parts.append("mellow relaxed")
        else:
            parts.append("powerful loud intense")
    if track.valence is not None:
        if track.valence < -0.1:
            parts.append("melancholic sad emotional")
        elif track.valence > 0.1:
            parts.append("happy positive uplifting")
        else:
            parts.append("neutral balanced")
    return " ".join(parts)


async def build_vibe_index() -> dict:
    """Build embeddings for all tracks in DB."""
    from sqlalchemy import select

    from database import AsyncSessionLocal
    from models import Track

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Track))
        tracks = result.scalars().all()

    if not tracks:
        return {"status": "no_tracks", "count": 0}

    logger.info(f"Building vibe index for {len(tracks)} tracks...")
    global _track_embeddings
    _track_embeddings = {}

    for track in tracks:
        text = _track_text(track)
        _track_embeddings[track.video_id] = _embed(text)

    logger.info(f"Vibe index built: {len(_track_embeddings)} tracks")
    return {"status": "ok", "count": len(_track_embeddings)}


async def vibe_search(
    query: str,
    limit: int = 20,
    search_youtube: bool = True,
) -> list[dict]:
    """
    Find tracks matching a vibe query.
    1. Embed the query
    2. Score all indexed tracks by cosine similarity
    3. Optionally search YouTube for more matches
    4. Return ranked results
    """
    logger.info(f"Vibe search: '{query}'")

    # Build index if empty
    if not _track_embeddings:
        await build_vibe_index()

    query_embedding = _embed(query)
    results = []

    # Score indexed tracks
    for video_id, track_embedding in _track_embeddings.items():
        similarity = float(np.dot(query_embedding, track_embedding))
        results.append({"video_id": video_id, "similarity": round(similarity, 4)})

    results.sort(key=lambda x: x["similarity"], reverse=True)

    # Get full track data
    from database import AsyncSessionLocal
    from models import Track

    async with AsyncSessionLocal() as session:
        track_map = {}
        for r in results[:limit]:
            track = await session.get(Track, r["video_id"])
            if track:
                track_map[r["video_id"]] = {
                    "video_id": track.video_id,
                    "title": track.title,
                    "artist": track.artist,
                    "album": track.album,
                    "duration_ms": track.duration_ms,
                    "thumbnail_url": track.thumbnail_url,
                    "bpm": track.bpm,
                    "key": track.key,
                    "energy": track.energy,
                    "similarity": next(
                        r["similarity"] for r in results if r["video_id"] == track.video_id
                    ),
                }

    indexed_results = [
        track_map[r["video_id"]] for r in results[:limit] if r["video_id"] in track_map
    ]

    # Supplement with YouTube search if not enough results
    if search_youtube and len(indexed_results) < limit:
        try:
            import dataclasses

            from services.search_service import search_tracks

            yt_results = await search_tracks(query, limit=limit - len(indexed_results))
            existing_ids = {r["video_id"] for r in indexed_results}
            for track in yt_results:
                d = dataclasses.asdict(track) if dataclasses.is_dataclass(track) else dict(track)
                if d.get("video_id") not in existing_ids:
                    d["similarity"] = 0.5
                    d["source"] = "youtube"
                    indexed_results.append(d)
        except Exception as e:
            logger.warning(f"YouTube supplement failed: {e}")

    logger.info(f"Vibe search '{query}': {len(indexed_results)} results")
    return indexed_results[:limit]
