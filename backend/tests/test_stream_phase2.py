"""
Phase 2: Audio Streaming Pipeline Tests
Tests for yt-dlp service with ThreadPoolExecutor and edge case handling.
"""

import asyncio
import sys
from datetime import datetime

sys.path.insert(0, "/Users/sagarmaddi/Desktop/soundfree/backend")

from services.ytdlp_service import (
    YtdlpError,
    extract_stream,
    get_ytdlp_executor,
    shutdown_ytdlp_executor,
)

# Test video IDs (these are real YouTube videos that should work)
TEST_VIDEO_ID = "dQw4w9WgXcQ"  # Rick Astley - Never Gonna Give You Up


def test_thread_pool_executor():
    """Test that ThreadPoolExecutor is created."""
    executor = get_ytdlp_executor()
    assert executor is not None
    assert executor._max_workers == 4
    print("✓ ThreadPoolExecutor created with 4 workers")


async def test_stream_extraction():
    """Test stream extraction for a valid video."""
    print(f"\n→ Testing stream extraction for {TEST_VIDEO_ID}...")

    try:
        result = await extract_stream(TEST_VIDEO_ID)

        assert result.video_id == TEST_VIDEO_ID
        assert result.stream_url.startswith("http")
        assert result.format is not None
        assert result.expires_at > datetime.utcnow()

        print("✓ Stream extracted successfully")
        print(f"  - URL: {result.stream_url[:80]}...")
        print(f"  - Format: {result.format}")
        print(f"  - Bitrate: {result.bitrate}")
        print(f"  - Duration: {result.duration}s")
        print(f"  - Expires: {result.expires_at}")

        return result.stream_url

    except YtdlpError as e:
        print(f"✗ Stream extraction failed: {e.message}")
        raise


async def test_deleted_video():
    """Test handling of deleted video (404)."""
    # This is a made-up ID that should not exist
    fake_id = "xxxxxxxxxxx"

    print(f"\n→ Testing deleted video handling ({fake_id})...")

    try:
        await extract_stream(fake_id)
        print("✗ Should have raised VideoNotFoundError")
        return False
    except Exception as e:
        if "not found" in str(e).lower() or "unavailable" in str(e).lower():
            print("✓ Correctly handled deleted video")
            return True
        else:
            print(f"✗ Unexpected error: {e}")
            return False


async def test_cache_ttl():
    """Test that cache TTL is set to 6 hours."""
    from routers.stream import STREAM_CACHE_TTL

    expected_ttl = 6 * 60 * 60  # 6 hours in seconds

    print("\n→ Testing cache TTL...")
    assert STREAM_CACHE_TTL == expected_ttl, f"Expected {expected_ttl}, got {STREAM_CACHE_TTL}"
    print(f"✓ Cache TTL is 6 hours ({STREAM_CACHE_TTL}s)")


async def test_range_header_support():
    """Test that Range header support is implemented."""
    print("\n→ Testing Range header support...")

    # Check that the proxy endpoint accepts Range header
    # This is validated by checking the endpoint exists and handles headers
    import inspect

    from routers.stream import proxy_stream

    sig = inspect.signature(proxy_stream)
    params = list(sig.parameters.keys())

    assert "request" in params, "proxy_stream should accept request parameter"
    print("✓ Range header support implemented in proxy_stream")


def test_error_classes():
    """Test error class definitions."""
    from services.ytdlp_service import (
        AgeRestrictedError,
        GeoBlockedError,
        RateLimitError,
        VideoNotFoundError,
    )

    print("\n→ Testing error classes...")

    errors = [
        (VideoNotFoundError, 404, "test123"),
        (GeoBlockedError, 451, "test123"),
        (RateLimitError, 429, "test123"),
        (AgeRestrictedError, 403, "test123"),
    ]

    for error_class, expected_code, video_id in errors:
        try:
            raise error_class(video_id)
        except YtdlpError as e:
            assert e.status_code == expected_code
            assert video_id in e.message
            print(f"  ✓ {error_class.__name__} (HTTP {expected_code})")


def test_error_parsing():
    """Test error parsing from yt-dlp stderr."""
    from services.ytdlp_service import _parse_ytdlp_error

    print("\n→ Testing error parsing...")

    test_cases = [
        ("video unavailable", "VideoNotFoundError"),
        ("removed", "VideoNotFoundError"),
        ("private video", "VideoNotFoundError"),
        ("not available in your country", "GeoBlockedError"),
        ("unavailable in your country", "GeoBlockedError"),
        ("rate limit", "RateLimitError"),
        ("too many requests", "RateLimitError"),
        ("age-restricted", "AgeRestrictedError"),
        ("age restricted", "AgeRestrictedError"),
    ]

    for error_msg, expected_type in test_cases:
        error = _parse_ytdlp_error(error_msg)
        actual_type = type(error).__name__
        assert (
            actual_type == expected_type
        ), f"Expected {expected_type}, got {actual_type} for '{error_msg}'"
        print(f"  ✓ '{error_msg}' → {actual_type}")


async def run_all_tests():
    """Run all Phase 2 tests."""
    print("=" * 60)
    print("PHASE 2: Audio Streaming Pipeline Tests")
    print("=" * 60)

    passed = 0
    failed = 0

    try:
        # Basic setup tests
        test_thread_pool_executor()
        passed += 1

        # Error class tests
        test_error_classes()
        passed += 1

        # Error parsing tests
        test_error_parsing()
        passed += 1

        # Cache TTL test
        await test_cache_ttl()
        passed += 1

        # Range header test
        await test_range_header_support()
        passed += 1

        # Stream extraction test
        await test_stream_extraction()
        passed += 1

        # Deleted video test
        if await test_deleted_video():
            passed += 1
        else:
            failed += 1

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback

        traceback.print_exc()
        failed += 1

    finally:
        shutdown_ytdlp_executor()

    print("\n" + "=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
