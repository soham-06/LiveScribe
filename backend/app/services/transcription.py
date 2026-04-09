import whisper
import threading

_model = None
_lock = threading.Lock()


def _get_model():
    """Lazy-load and cache the Whisper model (thread-safe singleton)."""
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                _model = whisper.load_model("base")
    return _model


def transcribe_audio(file_path: str) -> str:
    """
    Transcribe an audio file using OpenAI Whisper.
    
    Args:
        file_path: Path to the audio file on disk.
    
    Returns:
        The full transcription text.
    """
    model = _get_model()
    result = model.transcribe(file_path)
    return result["text"].strip()
