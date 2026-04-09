# Livescribe — AI Meeting Intelligence System

Upload meeting audio recordings and get AI-powered transcripts, summaries, key points, and action items.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Transcription | OpenAI Whisper (local) |
| AI Analysis | Groq API (LLaMA 3) |

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Fill in `backend/.env` with your credentials:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...
```

Start the server:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
```

Fill in `frontend/.env`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

### 3. Open the App

Navigate to **http://localhost:5173** in your browser.

## Features

- 🔐 User authentication (signup/login)
- 🎙️ Audio file upload with drag & drop
- 📝 AI-powered transcription (Whisper)
- 🧠 Meeting analysis (summary, key points, action items)
- 📊 Dashboard with search & filter
- 🗑️ Meeting deletion with storage cleanup

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login existing user |
| POST | `/meetings/upload` | Upload and process meeting |
| GET | `/meetings/` | List all user meetings |
| GET | `/meetings/{id}` | Get meeting details |
| DELETE | `/meetings/{id}` | Delete a meeting |
