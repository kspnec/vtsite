import cloudinary
import cloudinary.uploader

from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)


def upload_photo(file_bytes: bytes, user_id: int) -> str:
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


def delete_photo(user_id: int):
    cloudinary.uploader.destroy(f"vtsite/profiles/user_{user_id}")
