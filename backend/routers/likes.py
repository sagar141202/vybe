from fastapi import APIRouter
from loguru import logger
from sqlalchemy import delete, select

from database import AsyncSessionLocal
from models import LikedTrack

router = APIRouter()


@router.post("/{video_id}")
async def like_track(video_id: str) -> dict:
    """Like a track — upserts into liked_tracks."""
    try:
        async with AsyncSessionLocal() as session:
            existing = await session.execute(
                select(LikedTrack).where(LikedTrack.video_id == video_id)
            )
            if existing.scalar_one_or_none():
                return {"status": "already_liked"}

            session.add(
                LikedTrack(
                    video_id=video_id,
                    user_id=None,
                )
            )
            await session.commit()
            logger.info(f"Liked: {video_id}")
            return {"status": "liked"}
    except Exception as e:
        logger.warning(f"Like error: {e}")
        return {"status": "error", "detail": str(e)}


@router.delete("/{video_id}")
async def unlike_track(video_id: str) -> dict:
    """Unlike a track."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(delete(LikedTrack).where(LikedTrack.video_id == video_id))
            await session.commit()
            logger.info(f"Unliked: {video_id}")
            return {"status": "unliked"}
    except Exception as e:
        logger.warning(f"Unlike error: {e}")
        return {"status": "error", "detail": str(e)}


@router.get("/")
async def get_liked_tracks() -> list:
    """Get all liked tracks."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(LikedTrack).order_by(LikedTrack.liked_at.desc()))
            rows = result.scalars().all()
            return [
                {
                    "video_id": r.video_id,
                    "liked_at": r.liked_at.isoformat() if r.liked_at else None,
                }
                for r in rows
            ]
    except Exception as e:
        logger.warning(f"Get likes error: {e}")
        return []
