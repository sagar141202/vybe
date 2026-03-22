"""
Pure Python similarity search — replaces Annoy which crashes on Python 3.14.
Uses cosine similarity with numpy for fast vector comparison.
"""

import json
import os
from pathlib import Path

import numpy as np
from loguru import logger
from sqlalchemy import select

from database import AsyncSessionLocal
from models import Track

INDEX_DIR = Path("/tmp/vybe_index")
INDEX_DIR.mkdir(exist_ok=True)
META_PATH = str(INDEX_DIR / "tracks_meta.json")
VECTORS_PATH = str(INDEX_DIR / "tracks_vectors.npy")

FEATURES = ["bpm", "energy", "spectral_centroid", "valence", "danceability"]
N_DIMS = len(FEATURES)


def _normalize(vec: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec


async def build_index() -> dict:
    """Build in-memory index from all tracks with features."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Track).where(Track.bpm.isnot(None)))
        tracks = result.scalars().all()

    if not tracks:
        return {"status": "no_data", "count": 0}

    logger.info(f"Building index from {len(tracks)} tracks")

    vectors = []
    meta = {}

    for i, track in enumerate(tracks):
        vec = np.array(
            [
                float(track.bpm or 0),
                float(track.energy or 0),
                float(track.spectral_centroid or 0),
                float(track.valence or 0),
                float(track.danceability or 0),
            ],
            dtype=np.float32,
        )
        vectors.append(_normalize(vec))
        meta[i] = {
            "video_id": track.video_id,
            "title": track.title,
            "artist": track.artist,
            "album": track.album,
            "duration_ms": track.duration_ms,
            "thumbnail_url": track.thumbnail_url,
            "bpm": track.bpm,
            "key": track.key,
            "energy": track.energy,
        }

    # Save to disk
    np.save(VECTORS_PATH, np.stack(vectors))
    with open(META_PATH, "w") as f:
        json.dump(meta, f)

    logger.info(f"Index built: {len(tracks)} tracks → {VECTORS_PATH}")
    return {"status": "ok", "count": len(tracks), "path": VECTORS_PATH}


def load_index() -> tuple[np.ndarray, dict] | None:
    """Load index from disk."""
    if not os.path.exists(VECTORS_PATH) or not os.path.exists(META_PATH):
        return None
    vectors = np.load(VECTORS_PATH)
    with open(META_PATH) as f:
        meta = {int(k): v for k, v in json.load(f).items()}
    return vectors, meta


def query_similar(
    features: dict,
    n: int = 20,
    exclude_ids: set | None = None,
) -> list[dict]:
    """Find n most similar tracks using cosine similarity."""
    loaded = load_index()
    if not loaded:
        logger.warning("Index not found — rebuild needed")
        return []

    vectors, meta = loaded

    # Build query vector
    query = np.array(
        [
            float(features.get("bpm", 0)),
            float(features.get("energy", 0)),
            float(features.get("spectral_centroid", 0)),
            float(features.get("valence", 0)),
            float(features.get("danceability", 0)),
        ],
        dtype=np.float32,
    )
    query = _normalize(query)

    # Cosine similarities (dot product of normalized vectors)
    similarities = vectors @ query

    # Sort by similarity descending
    indices = np.argsort(similarities)[::-1]

    results = []
    for idx in indices:
        track_meta = meta.get(int(idx))
        if not track_meta:
            continue
        if exclude_ids and track_meta["video_id"] in exclude_ids:
            continue
        results.append(
            {
                **track_meta,
                "similarity": round(float(similarities[idx]), 4),
            }
        )
        if len(results) >= n:
            break

    return results
