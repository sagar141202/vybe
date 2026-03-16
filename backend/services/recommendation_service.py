import math

from loguru import logger
from sqlalchemy import desc, select

from database import AsyncSessionLocal
from models import PlayHistory, Track


async def compute_user_vector(limit: int = 100) -> dict | None:
    """
    Compute weighted average of audio features for last N plays.
    Recent plays are weighted higher using exponential decay.
    Returns a feature vector dict or None if not enough data.
    """
    async with AsyncSessionLocal() as session:
        # Get last N plays with track features
        result = await session.execute(
            select(PlayHistory, Track)
            .join(Track, PlayHistory.video_id == Track.video_id)
            .where(Track.bpm.isnot(None))
            .order_by(desc(PlayHistory.played_at))
            .limit(limit)
        )
        rows = result.all()

    if len(rows) < 3:
        logger.info(f"Not enough plays for recommendation ({len(rows)} plays with features)")
        return None

    logger.info(f"Computing user vector from {len(rows)} plays")

    # Exponential decay weights — recent plays matter more
    # w_i = e^(-decay * i) where i=0 is most recent
    decay = 0.05
    weights = [math.exp(-decay * i) for i in range(len(rows))]
    total_weight = sum(weights)

    # Weighted averages
    features = ["bpm", "energy", "spectral_centroid", "valence", "danceability"]
    vector = {}

    for feat in features:
        weighted_sum = 0.0
        for i, (_play, track) in enumerate(rows):
            val = getattr(track, feat)
            if val is not None:
                weighted_sum += weights[i] * float(val)
        vector[feat] = round(weighted_sum / total_weight, 6)

    # Key distribution (most common key in recent plays)
    key_weights: dict[str, float] = {}
    for i, (_play, track) in enumerate(rows):
        if track.key:
            key_weights[track.key] = key_weights.get(track.key, 0) + weights[i]
    vector["preferred_key"] = max(key_weights, key=key_weights.get) if key_weights else None

    # Play count stats
    vector["play_count"] = len(rows)
    vector["unique_tracks"] = len({play.video_id for play, _ in rows})

    logger.info(
        f"User vector: BPM={vector['bpm']:.1f} "
        f"Energy={vector['energy']:.4f} "
        f"Key={vector['preferred_key']}"
    )
    return vector


async def score_track(track: Track, user_vector: dict) -> float:
    """
    Score a track against the user vector.
    Returns 0-1 similarity score.
    """
    if not user_vector or track.bpm is None:
        return 0.0

    scores = []

    # BPM similarity (within 20 BPM = perfect)
    bpm_diff = abs(track.bpm - user_vector["bpm"])
    bpm_score = max(0, 1 - bpm_diff / 20)
    scores.append(("bpm", bpm_score, 0.25))

    # Energy similarity
    energy_diff = abs(track.energy - user_vector["energy"])
    energy_score = max(0, 1 - energy_diff / 0.1)
    scores.append(("energy", energy_score, 0.25))

    # Danceability similarity
    dance_diff = abs(track.danceability - user_vector["danceability"])
    dance_score = max(0, 1 - dance_diff / 0.5)
    scores.append(("danceability", dance_score, 0.2))

    # Valence similarity
    valence_diff = abs(track.valence - user_vector["valence"])
    valence_score = max(0, 1 - valence_diff / 0.1)
    scores.append(("valence", valence_score, 0.15))

    # Key bonus
    key_score = 1.0 if track.key == user_vector.get("preferred_key") else 0.5
    scores.append(("key", key_score, 0.15))

    # Weighted total
    total = sum(score * weight for _, score, weight in scores)
    return round(total, 4)


async def get_recommendations(limit: int = 20) -> list[dict]:
    """Get recommended tracks based on user listening vector."""
    user_vector = await compute_user_vector()
    if not user_vector:
        return []

    async with AsyncSessionLocal() as session:
        # Get all tracks with features
        result = await session.execute(select(Track).where(Track.bpm.isnot(None)))
        tracks = result.scalars().all()

    if not tracks:
        return []

    # Score and sort
    scored = []
    for track in tracks:
        score = await score_track(track, user_vector)
        scored.append(
            {
                "video_id": track.video_id,
                "title": track.title,
                "artist": track.artist,
                "album": track.album,
                "duration_ms": track.duration_ms,
                "thumbnail_url": track.thumbnail_url,
                "score": score,
                "bpm": track.bpm,
                "key": track.key,
                "energy": track.energy,
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)

    logger.info(f"Top recommendation: {scored[0]['title']} (score={scored[0]['score']})")
    return scored[:limit]
