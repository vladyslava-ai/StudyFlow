import os
import time
from collections import defaultdict, deque

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from google import genai
from google.genai import errors
from pydantic import BaseModel, Field
from ..auth import current_user
from ..models import User

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"], dependencies=[Depends(current_user)])


request_history = defaultdict(deque)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, user: User = Depends(current_user)):
    # AI_RATE_LIMIT_CHECK
    now = time.monotonic()
    history = request_history[user.id]

    while history and now - history[0] >= 60:
        history.popleft()

    if len(history) >= 10:
        raise HTTPException(
            status_code=429,
            detail="AI request limit: 10 messages per minute."
        )

    history.append(now)

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured."
        )

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=(
                "Ти  StudyFlow AI Assistant, дружній помічник "
                "для навчання. Відповідай українською мовою, "
                "зрозуміло, структуровано та корисно.\n\n"
                f"Запитання користувача: {request.message}"
            ),
        )

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="AI returned an empty response."
            )

        return ChatResponse(answer=response.text)

    except errors.APIError as error:
        if error.code == 429:
            raise HTTPException(
                status_code=429,
                detail="AI request limit reached. Try again later."
            ) from error

        raise HTTPException(
            status_code=502,
            detail="AI service is temporarily unavailable."
        ) from error
