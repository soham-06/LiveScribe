import json
import re
from groq import Groq
from app.config import get_settings


ANALYSIS_PROMPT = """You are an AI meeting analyst. Analyze the following meeting transcript and provide structured insights.

Return your response as a valid JSON object with exactly these keys:
- "summary": A concise 2-4 sentence summary of the meeting
- "key_points": An array of 3-7 key discussion points (strings)
- "action_items": An array of action item objects, each with:
  - "person": The person responsible (use "Unassigned" if unclear)
  - "task": What needs to be done
  - "deadline": The deadline mentioned (use "Not specified" if none)

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, no extra text.

TRANSCRIPT:
{transcript}
"""


def analyze_transcript(transcript: str) -> dict:
    """
    Use Groq (LLaMA 3) to analyze a meeting transcript and extract
    summary, key points, and action items.
    
    Args:
        transcript: The full meeting transcript text.
    
    Returns:
        Dict with keys: summary, key_points, action_items
    """
    settings = get_settings()
    client = Groq(api_key=settings.GROQ_API_KEY)

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a helpful meeting analyst. Always respond with valid JSON only.",
            },
            {
                "role": "user",
                "content": ANALYSIS_PROMPT.format(transcript=transcript),
            },
        ],
        model="llama3-8b-8192",
        temperature=0.3,
        max_tokens=2048,
        top_p=1,
    )

    raw_response = chat_completion.choices[0].message.content.strip()

    # Try to parse the JSON response
    try:
        result = json.loads(raw_response)
    except json.JSONDecodeError:
        # Sometimes LLMs wrap JSON in markdown code blocks, try to extract
        json_match = re.search(r'\{[\s\S]*\}', raw_response)
        if json_match:
            try:
                result = json.loads(json_match.group())
            except json.JSONDecodeError:
                # Fallback: return a structured response with the raw text
                result = {
                    "summary": raw_response[:500],
                    "key_points": ["Analysis could not be fully parsed."],
                    "action_items": [],
                }
        else:
            result = {
                "summary": raw_response[:500],
                "key_points": ["Analysis could not be fully parsed."],
                "action_items": [],
            }

    # Ensure all required keys exist
    result.setdefault("summary", "No summary generated.")
    result.setdefault("key_points", [])
    result.setdefault("action_items", [])

    return result
