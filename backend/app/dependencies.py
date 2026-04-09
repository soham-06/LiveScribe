from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.config import get_settings, Settings

security = HTTPBearer()


def get_supabase(settings: Settings = Depends(get_settings)) -> Client:
    """Create a Supabase client with the service role key (full admin access)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_supabase_anon(settings: Settings = Depends(get_settings)) -> Client:
    """Create a Supabase client with the anon key (respects RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
) -> str:
    """
    Extract and verify the JWT from the Authorization header.
    Returns the user_id (UUID string) of the authenticated user.
    """
    token = credentials.credentials
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user.id
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
