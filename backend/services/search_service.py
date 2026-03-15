from dataclasses import dataclass

from loguru import logger
from ytmusicapi import YTMusic

ytmusic = YTMusic()


@dataclass
class TrackResult:
    video_id: str
    title: str
    artist: str
    album: str | None
    duration_ms: int | None
    thumbnail_url: str | None


def _best_thumbnail(thumbnails: list[dict]) -> str | None:
    """Pick the highest resolution thumbnail from the list."""
    if not thumbnails:
        return None
    return max(thumbnails, key=lambda t: t.get("width", 0)).get("url")


def _duration_to_ms(duration_str: str | None) -> int | None:
    """Convert '3:45' or '1:03:45' to milliseconds."""
    if not duration_str:
        return None
    parts = duration_str.split(":")
    try:
        if len(parts) == 2:
            return (int(parts[0]) * 60 + int(parts[1])) * 1000
        elif len(parts) == 3:
            return (int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])) * 1000
    except ValueError:
        return None
    return None


async def search_tracks(query: str, limit: int = 20) -> list[TrackResult]:
    """Search YouTube Music and return a list of track results."""
    logger.info(f"Searching YouTube Music: '{query}'")
    try:
        results = ytmusic.search(query, filter="songs", limit=limit)
        tracks = []
        for item in results:
            video_id = item.get("videoId")
            if not video_id:
                continue

            title = item.get("title", "Unknown")
            artists = item.get("artists", [])
            artist = artists[0].get("name", "Unknown") if artists else "Unknown"
            album_data = item.get("album")
            album = album_data.get("name") if album_data else None
            duration_ms = _duration_to_ms(item.get("duration"))
            thumbnails = item.get("thumbnails", [])
            thumbnail_url = _best_thumbnail(thumbnails)

            tracks.append(
                TrackResult(
                    video_id=video_id,
                    title=title,
                    artist=artist,
                    album=album,
                    duration_ms=duration_ms,
                    thumbnail_url=thumbnail_url,
                )
            )

        logger.info(f"Search returned {len(tracks)} tracks for '{query}'")
        return tracks

    except Exception as e:
        logger.error(f"Search failed for '{query}': {e}")
        return []
