import os
import uuid
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from supabase import Client
from app.dependencies import get_supabase, get_current_user
from app.models import MeetingListItem, MeetingDetail, MeetingUploadResponse
from app.services.transcription import transcribe_audio
from app.services.analysis import analyze_transcript
from app.services.storage import upload_audio_to_storage, delete_audio_from_storage
from app.services.email import send_action_items_email

router = APIRouter()

# Allowed audio file extensions
ALLOWED_EXTENSIONS = {"mp3", "wav", "m4a", "ogg", "webm", "flac", "mp4", "wma"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/upload", response_model=MeetingUploadResponse)
async def upload_meeting(
    file: UploadFile = File(...),
    title: str = Form(...),
    user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """
    Upload a meeting audio file, transcribe it, analyze it with AI,
    and store all results in the database.
    """
    # Validate file extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file bytes
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 50MB.",
        )

    # 1. Upload to Supabase Storage
    try:
        audio_url = upload_audio_to_storage(supabase, user_id, file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload audio: {str(e)}",
        )

    # 2. Save to temp file for Whisper transcription
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            tmp.write(file_bytes)
            temp_path = tmp.name

        # 3. Transcribe with Whisper
        transcript = transcribe_audio(temp_path)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}",
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

    # 4. Analyze with Groq LLM
    try:
        analysis = analyze_transcript(transcript)
    except Exception as e:
        # Log the actual error so we can debug
        print(f"[ERROR] Groq analysis failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        # If analysis fails, still save the meeting with just the transcript
        analysis = {
            "summary": f"Analysis could not be completed. Error: {str(e)}",
            "key_points": [],
            "action_items": [],
        }

    # 5. Save to database
    try:
        import json
        meeting_data = {
            "user_id": user_id,
            "title": title,
            "audio_url": audio_url,
            "transcript": transcript,
            "summary": analysis.get("summary", ""),
            "key_points": json.dumps(analysis.get("key_points", [])),
            "action_items": json.dumps(analysis.get("action_items", [])),
        }

        result = supabase.table("meetings").insert(meeting_data).execute()

        if not result.data:
            raise Exception("No data returned from insert")

        meeting = result.data[0]

        # 6. Send action items email to the user
        try:
            user_response = supabase.auth.admin.get_user_by_id(user_id)
            user_email = user_response.user.email if user_response and user_response.user else None
            if user_email:
                send_action_items_email(
                    to_email=user_email,
                    meeting_title=title,
                    summary=analysis.get("summary", ""),
                    action_items=analysis.get("action_items", []),
                )
        except Exception as e:
            # Never let email failure block the response
            print(f"[EMAIL] Could not send action items email: {e}")

        return MeetingUploadResponse(
            id=meeting["id"],
            title=meeting["title"],
            message="Meeting uploaded and processed successfully!",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save meeting: {str(e)}",
        )


@router.get("/", response_model=list[MeetingListItem])
async def list_meetings(
    user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Get all meetings for the authenticated user, newest first."""
    try:
        result = (
            supabase.table("meetings")
            .select("id, title, summary, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return [
            MeetingListItem(
                id=m["id"],
                title=m["title"],
                summary=m.get("summary"),
                created_at=m["created_at"],
            )
            for m in result.data
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch meetings: {str(e)}",
        )


@router.get("/{meeting_id}", response_model=MeetingDetail)
async def get_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Get full details of a specific meeting."""
    try:
        result = (
            supabase.table("meetings")
            .select("*")
            .eq("id", meeting_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found.",
            )

        m = result.data[0]

        # Parse JSON fields if they're strings
        import json
        key_points = m.get("key_points", [])
        action_items = m.get("action_items", [])

        if isinstance(key_points, str):
            try:
                key_points = json.loads(key_points)
            except json.JSONDecodeError:
                key_points = []

        if isinstance(action_items, str):
            try:
                action_items = json.loads(action_items)
            except json.JSONDecodeError:
                action_items = []

        return MeetingDetail(
            id=m["id"],
            title=m["title"],
            audio_url=m.get("audio_url"),
            transcript=m.get("transcript"),
            summary=m.get("summary"),
            key_points=key_points,
            action_items=action_items,
            created_at=m["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch meeting: {str(e)}",
        )


@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Delete a specific meeting and its audio file."""
    try:
        # First get the meeting to find the audio URL
        result = (
            supabase.table("meetings")
            .select("id, audio_url")
            .eq("id", meeting_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found.",
            )

        meeting = result.data[0]

        # Delete audio from storage
        if meeting.get("audio_url"):
            delete_audio_from_storage(supabase, meeting["audio_url"])

        # Delete from database
        supabase.table("meetings").delete().eq("id", meeting_id).eq("user_id", user_id).execute()

        return {"message": "Meeting deleted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete meeting: {str(e)}",
        )
