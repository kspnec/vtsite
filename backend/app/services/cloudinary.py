import cloudinary
import cloudinary.uploader
from pathlib import Path

from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

_CLOUDINARY_CONFIGURED = bool(
    settings.CLOUDINARY_CLOUD_NAME
    and settings.CLOUDINARY_API_KEY
    and settings.CLOUDINARY_API_SECRET
)

UPLOAD_DIR = Path("/app/uploads")


def upload_photo(file_bytes: bytes, user_id: int) -> str:
    if _CLOUDINARY_CONFIGURED:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="vtsite/profiles",
            public_id=f"user_{user_id}",
            overwrite=True,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"}
            ],
        )
        return result["secure_url"]

    # Local fallback: save to /app/uploads/ and return absolute URL
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = "jpg"
    if len(file_bytes) > 4:
        if file_bytes[:8] == b"\x89PNG\r\n\x1a\n":
            ext = "png"
        elif file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP":
            ext = "webp"
    filename = f"user_{user_id}.{ext}"
    (UPLOAD_DIR / filename).write_bytes(file_bytes)
    return f"{settings.BACKEND_BASE_URL}/static/{filename}"


def delete_photo(user_id: int):
    if _CLOUDINARY_CONFIGURED:
        cloudinary.uploader.destroy(f"vtsite/profiles/user_{user_id}")
    else:
        for ext in ("jpg", "png", "webp"):
            p = UPLOAD_DIR / f"user_{user_id}.{ext}"
            if p.exists():
                p.unlink()
