import uuid
from supabase import Client


def upload_audio_to_storage(
    supabase: Client,
    user_id: str,
    file_bytes: bytes,
    original_filename: str,
) -> str:
    """
    Upload an audio file to Supabase Storage.
    
    Args:
        supabase: Supabase client instance (service role).
        user_id: The authenticated user's UUID.
        file_bytes: Raw bytes of the audio file.
        original_filename: Original name of the uploaded file.
    
    Returns:
        The public URL of the uploaded file.
    """
    # Extract file extension
    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "mp3"
    
    # Create a unique path: user_id/uuid.ext
    file_id = str(uuid.uuid4())
    storage_path = f"{user_id}/{file_id}.{ext}"

    # Determine content type
    content_type_map = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "m4a": "audio/mp4",
        "ogg": "audio/ogg",
        "webm": "audio/webm",
        "flac": "audio/flac",
    }
    content_type = content_type_map.get(ext.lower(), "audio/mpeg")

    # Upload to the meeting-audio bucket
    supabase.storage.from_("meeting-audio").upload(
        path=storage_path,
        file=file_bytes,
        file_options={
            "content-type": content_type,
            "upsert": "false",
        },
    )

    # Get the public URL
    public_url = supabase.storage.from_("meeting-audio").get_public_url(storage_path)

    return public_url


def delete_audio_from_storage(supabase: Client, audio_url: str) -> None:
    """
    Delete an audio file from Supabase Storage given its public URL.
    
    Args:
        supabase: Supabase client instance.
        audio_url: The full public URL of the audio file.
    """
    try:
        # Extract the path from the URL
        # URL format: https://xxx.supabase.co/storage/v1/object/public/meeting-audio/user_id/file.mp3
        if "meeting-audio/" in audio_url:
            path = audio_url.split("meeting-audio/")[1]
            supabase.storage.from_("meeting-audio").remove([path])
    except Exception:
        # Don't fail the main operation if storage cleanup fails
        pass
