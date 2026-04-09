from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, meetings

app = FastAPI(
    title="Livescribe — AI Meeting Intelligence",
    description="Upload meeting audio, get AI-powered transcripts, summaries, key points, and action items.",
    version="1.0.0",
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Livescribe API"}
