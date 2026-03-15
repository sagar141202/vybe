import httpx
from loguru import logger

GENIUS_BASE = "https://api.genius.com"


async def get_lyrics_genius(
    artist: str,
    title: str,
    access_token: str,
) -> dict | None:
    """
    Fetch static lyrics from Genius API.
    Returns {'lines': [{'time_ms': 0, 'text': lyrics}], 'synced': False, 'source': 'genius'}
    """
    if not access_token:
        logger.warning("Genius access token not set")
        return None

    logger.info(f"Genius lookup: {artist} — {title}")

    try:
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            # Search for the song
            resp = await client.get(
                f"{GENIUS_BASE}/search",
                params={"q": f"{artist} {title}"},
            )
            resp.raise_for_status()
            data = resp.json()

        hits = data.get("response", {}).get("hits", [])
        if not hits:
            logger.warning(f"Genius: no results for {artist} — {title}")
            return None

        # Find best match
        best_hit = None
        for hit in hits[:5]:
            result = hit.get("result", {})
            result_title = result.get("title", "").lower()
            result_artist = result.get("primary_artist", {}).get("name", "").lower()

            if title.lower() in result_title and artist.lower() in result_artist:
                best_hit = result
                break

        if not best_hit:
            best_hit = hits[0].get("result", {})

        song_id = best_hit.get("id")
        song_title = best_hit.get("title", title)
        song_artist = best_hit.get("primary_artist", {}).get("name", artist)

        if not song_id:
            return None

        logger.info(f"Genius: found '{song_title}' by {song_artist} (id: {song_id})")

        # Return song info — actual lyrics scraping requires HTML parsing
        # which is fragile. Return the Genius URL for the frontend to display.
        genius_url = best_hit.get("url", "")

        return {
            "lines": [
                {
                    "time_ms": 0,
                    "text": f"Lyrics available on Genius: {genius_url}",
                }
            ],
            "synced": False,
            "source": "genius",
            "genius_url": genius_url,
            "song_title": song_title,
            "song_artist": song_artist,
        }

    except httpx.HTTPError as e:
        logger.error(f"Genius HTTP error: {e}")
        return None
    except Exception as e:
        logger.error(f"Genius error: {e}")
        return None
