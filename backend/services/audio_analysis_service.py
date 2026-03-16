import asyncio
from pathlib import Path

import numpy as np
from loguru import logger

# Import librosa lazily to avoid startup slowdown
_librosa = None


def _get_librosa():
    global _librosa
    if _librosa is None:
        import librosa

        _librosa = librosa
    return _librosa


def _extract_features_sync(audio_path: str) -> dict:
    """Extract audio features synchronously (runs in thread pool)."""
    lr = _get_librosa()

    logger.info(f"Analyzing audio: {audio_path}")

    # Load audio (mono, 22050 Hz, max 60s for speed)
    y, sr = lr.load(audio_path, mono=True, duration=60.0)

    # BPM
    tempo, _ = lr.beat.beat_track(y=y, sr=sr)
    bpm = float(tempo[0]) if hasattr(tempo, "__len__") else float(tempo)

    # Key detection via chroma
    chroma = lr.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)
    key_index = int(np.argmax(chroma_mean))
    key_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    key = key_names[key_index]

    # Energy (RMS)
    rms = lr.feature.rms(y=y)
    energy = float(np.mean(rms))

    # Spectral centroid (brightness)
    spectral_centroid = lr.feature.spectral_centroid(y=y, sr=sr)
    spectral_centroid_mean = float(np.mean(spectral_centroid))

    # Valence proxy (major vs minor via harmonic content)
    harmonic = lr.effects.harmonic(y)
    tonnetz = lr.feature.tonnetz(y=harmonic, sr=sr)
    valence = float(np.mean(tonnetz[0]))  # Fifth interval proxy

    # Danceability proxy (beat strength consistency)
    onset_env = lr.onset.onset_strength(y=y, sr=sr)
    danceability = float(np.std(onset_env) / (np.mean(onset_env) + 1e-6))

    features = {
        "bpm": round(bpm, 2),
        "key": key,
        "energy": round(energy, 6),
        "spectral_centroid": round(spectral_centroid_mean, 2),
        "valence": round(float(valence), 6),
        "danceability": round(float(danceability), 6),
    }

    logger.info(f"Features: BPM={bpm:.1f} Key={key} Energy={energy:.4f}")
    return features


async def extract_features(audio_path: str) -> dict | None:
    """Extract audio features asynchronously."""
    path = Path(audio_path)
    if not path.exists():
        logger.warning(f"Audio file not found: {audio_path}")
        return None

    try:
        loop = asyncio.get_event_loop()
        features = await loop.run_in_executor(None, _extract_features_sync, audio_path)
        return features
    except Exception as e:
        logger.error(f"Feature extraction failed: {e}")
        return None


async def analyze_and_store(video_id: str, audio_path: str) -> dict | None:
    """Extract features and store in Track table."""
    from database import AsyncSessionLocal
    from models import Track

    features = await extract_features(audio_path)
    if not features:
        return None

    try:
        async with AsyncSessionLocal() as session:
            track = await session.get(Track, video_id)
            if track:
                track.bpm = features["bpm"]
                track.key = features["key"]
                track.energy = features["energy"]
                track.spectral_centroid = features["spectral_centroid"]
                track.valence = features["valence"]
                track.danceability = features["danceability"]
                await session.commit()
                logger.info(f"Stored features for {video_id}")
    except Exception as e:
        logger.warning(f"DB store error: {e}")

    return features
