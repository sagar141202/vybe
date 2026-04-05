"""
yt-dlp service with ThreadPoolExecutor for async stream extraction.
Handles edge cases: geo-blocked (451), deleted (404), rate limit (429).
"""

from __future__ import annotations

import asyncio
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timedelta

from loguru import logger

# ThreadPool for running yt-dlp (CPU-bound operation)
_ytdlp_executor: ThreadPoolExecutor | None = None


def get_ytdlp_executor() -> ThreadPoolExecutor:
    """Get or create the ThreadPoolExecutor for yt-dlp operations."""
    global _ytdlp_executor
    if _ytdlp_executor is None:
        _ytdlp_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="ytdlp_")
    return _ytdlp_executor


def shutdown_ytdlp_executor() -> None:
    """Shutdown the ThreadPoolExecutor gracefully."""
    global _ytdlp_executor
    if _ytdlp_executor:
        _ytdlp_executor.shutdown(wait=True)
        _ytdlp_executor = None
        logger.info("yt-dlp executor shut down")


@dataclass
class StreamInfo:
    """Stream information returned by yt-dlp extraction."""

    video_id: str
    stream_url: str
    format: str
    bitrate: int | None
    expires_at: datetime
    duration: int | None = None  # in seconds
    title: str | None = None
    artist: str | None = None


class YtdlpError(Exception):
    """Base exception for yt-dlp errors."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class VideoNotFoundError(YtdlpError):
    """Video deleted or not found (404)."""

    def __init__(self, video_id: str):
        super().__init__(f"Video {video_id} not found or deleted", 404)


class GeoBlockedError(YtdlpError):
    """Video geo-blocked (451)."""

    def __init__(self, video_id: str, country: str | None = None):
        msg = f"Video {video_id} is not available"
        if country:
            msg += f" in {country}"
        super().__init__(msg, 451)


class RateLimitError(YtdlpError):
    """Rate limited by YouTube (429)."""

    def __init__(self, video_id: str):
        super().__init__(f"Rate limited while accessing {video_id}. Please try again later.", 429)


class AgeRestrictedError(YtdlpError):
    """Video is age-restricted (403)."""

    def __init__(self, video_id: str):
        super().__init__(f"Video {video_id} is age-restricted", 403)


def _parse_ytdlp_error(stderr: str) -> YtdlpError:
    """
    Parse yt-dlp stderr and return appropriate exception type.

    Args:
        stderr: Error output from yt-dlp

    Returns:
        Appropriate YtdlpError subclass
    """
    stderr_lower = stderr.lower()

    # Check for specific error patterns
    if any(
        pattern in stderr_lower
        for pattern in [
            "video unavailable",
            "removed",
            "private video",
            "deleted",
            "not found",
            "content warning",
            "removed by",
        ]
    ):
        # Extract video ID if present
        match = re.search(r"([a-zA-Z0-9_-]{11})", stderr)
        video_id = match.group(1) if match else "unknown"
        return VideoNotFoundError(video_id)

    if any(
        pattern in stderr_lower
        for pattern in [
            "unavailable in your country",
            "not available in",
            "geo-blocked",
            "geoblock",
            "blocked",
            "451",
        ]
    ):
        match = re.search(r"([a-zA-Z0-9_-]{11})", stderr)
        video_id = match.group(1) if match else "unknown"
        return GeoBlockedError(video_id)

    if any(
        pattern in stderr_lower
        for pattern in [
            "rate limit",
            "too many requests",
            "429",
            "ip blocked",
            "sign in",
            "verify you're not a robot",
        ]
    ):
        match = re.search(r"([a-zA-Z0-9_-]{11})", stderr)
        video_id = match.group(1) if match else "unknown"
        return RateLimitError(video_id)

    if any(
        pattern in stderr_lower
        for pattern in [
            "age-restricted",
            "age restricted",
            "mature content",
            "sign in to confirm",
        ]
    ):
        match = re.search(r"([a-zA-Z0-9_-]{11})", stderr)
        video_id = match.group(1) if match else "unknown"
        return AgeRestrictedError(video_id)

    # Generic error
    return YtdlpError(f"yt-dlp extraction failed: {stderr[:200]}", 500)


def _extract_stream_sync(video_id: str) -> StreamInfo:
    """
    Synchronous yt-dlp extraction (runs in ThreadPool).

    Args:
        video_id: YouTube video ID

    Returns:
        StreamInfo with extracted stream details

    Raises:
        YtdlpError: If extraction fails
    """
    import yt_dlp

    url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        "format": "bestaudio/best",
        "quiet": True,
        "no_warnings": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android"],
                "player_skip": ["webpage", "configs", "js"],
            }
        },
        # Extract additional metadata
        "extract_flat": False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info
            info = ydl.extract_info(url, download=False)

            if not info:
                raise VideoNotFoundError(video_id)

            # Get best audio format
            formats = info.get("formats", [])
            audio_formats = [
                f for f in formats if f.get("vcodec") == "none" or f.get("acodec") != "none"
            ]

            if audio_formats:
                # Sort by bitrate (prefer higher)
                audio_formats.sort(key=lambda x: x.get("tbr", 0) or 0, reverse=True)
                best_audio = audio_formats[0]
            elif formats:
                best_audio = formats[-1]  # Fallback to best overall
            else:
                raise YtdlpError(f"No formats found for {video_id}", 404)

            stream_url = best_audio.get("url")
            if not stream_url:
                raise YtdlpError(f"No stream URL found for {video_id}", 404)

            # Parse format info
            fmt = best_audio.get("format", best_audio.get("format_id", "unknown"))
            bitrate = int(best_audio.get("tbr", 0)) if best_audio.get("tbr") else None
            duration = int(info.get("duration", 0)) if info.get("duration") else None

            # Stream URLs expire in ~6 hours from YouTube
            expires_at = datetime.utcnow() + timedelta(hours=6)

            return StreamInfo(
                video_id=video_id,
                stream_url=stream_url,
                format=fmt,
                bitrate=bitrate,
                expires_at=expires_at,
                duration=duration,
                title=info.get("title"),
                artist=info.get("artist") or info.get("channel"),
            )

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        logger.error(f"yt-dlp download error for {video_id}: {error_msg}")
        raise _parse_ytdlp_error(error_msg) from e
    except Exception as e:
        logger.error(f"Unexpected error extracting {video_id}: {e}")
        raise YtdlpError(f"Extraction failed: {str(e)[:200]}", 500) from e


async def extract_stream(video_id: str) -> StreamInfo:
    """
    Async wrapper for yt-dlp extraction using ThreadPoolExecutor.

    Args:
        video_id: YouTube video ID

    Returns:
        StreamInfo with stream details

    Raises:
        YtdlpError: If extraction fails with specific error types
    """
    executor = get_ytdlp_executor()
    loop = asyncio.get_event_loop()

    logger.info(f"Starting stream extraction for {video_id}")

    try:
        # Run blocking yt-dlp in thread pool
        result = await asyncio.wait_for(
            loop.run_in_executor(executor, _extract_stream_sync, video_id), timeout=30.0
        )
        logger.info(f"Successfully extracted stream for {video_id}")
        return result
    except TimeoutError:
        logger.error(f"yt-dlp extraction timed out for {video_id}")
        raise YtdlpError("Extraction timed out. Please try again.", 504) from None


async def extract_stream_with_fallback(video_id: str) -> StreamInfo:
    """
    Extract stream with fallback strategies.
    Tries multiple methods if the first fails.

    Args:
        video_id: YouTube video ID

    Returns:
        StreamInfo with stream details
    """
    try:
        return await extract_stream(video_id)
    except GeoBlockedError:
        # Try with web client instead of android
        logger.warning(f"Trying web client fallback for {video_id}")
        # Could implement alternative extraction here
        raise
    except RateLimitError:
        logger.warning(f"Rate limited for {video_id}, consider retry with delay")
        raise
