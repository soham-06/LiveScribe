from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth Models ──────────────────────────────────────────────

class AuthRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str


# ── Meeting Models ───────────────────────────────────────────

class ActionItem(BaseModel):
    person: str = ""
    task: str = ""
    deadline: str = ""


class MeetingListItem(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    created_at: str


class MeetingDetail(BaseModel):
    id: str
    title: str
    audio_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    key_points: list = []
    action_items: list = []
    created_at: str


class MeetingUploadResponse(BaseModel):
    id: str
    title: str
    message: str
