from fastapi import APIRouter, HTTPException, status
from supabase import create_client
from app.models import AuthRequest, AuthResponse
from app.config import get_settings

router = APIRouter()


@router.post("/signup", response_model=AuthResponse)
async def signup(request: AuthRequest):
    """Register a new user with email and password."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup failed. User may already exist.",
            )

        # If email confirmation is disabled, session is returned immediately
        if response.session:
            return AuthResponse(
                access_token=response.session.access_token,
                user_id=response.user.id,
                email=response.user.email,
            )

        # If email confirmation is enabled, no session yet
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="Signup successful. Please check your email to confirm your account.",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup error: {str(e)}",
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: AuthRequest):
    """Sign in an existing user with email and password."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })

        if response.user is None or response.session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        return AuthResponse(
            access_token=response.session.access_token,
            user_id=response.user.id,
            email=response.user.email,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login error: {str(e)}",
        )
