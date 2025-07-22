"""
api.py — FastAPI gateway for Slurpy
----------------------------------
• POST /chat   → chats with Slurpy (JWT + optional API key)
• GET  /health → simple liveness probe
"""

from __future__ import annotations

import os, uuid
from typing import Deque, Dict, Tuple

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from collections import deque

from clerk_sdk import ClerkClient            
from rag_core import slurpy_answer           

# ──────────────────────────────────────────────────────────────────────────
# Clerk setup
# ──────────────────────────────────────────────────────────────────────────
# CLERK_SECRET_KEY must be in env.
clerk = ClerkClient()

def get_clerk_user_id(req: Request) -> str:
    """Extract & verify Clerk session; return user_id or 401."""
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Missing Clerk session token")
    token = auth.split(" ", 1)[1]
    try:
        session = clerk.sessions.verify_session(token)
        return session.user_id
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid Clerk session")

# ──────────────────────────────────────────────────────────────────────────
# Optional internal API key
# ──────────────────────────────────────────────────────────────────────────
API_KEY_NAME = "X-API-KEY"
_INTERNAL_API_KEY = os.getenv("SLURPY_API_KEY")  # set in prod if desired

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_internal_api_key(key: str | None = Depends(api_key_header)):
    if _INTERNAL_API_KEY is None:          # feature disabled
        return
    if key == _INTERNAL_API_KEY:
        return
    raise HTTPException(status_code=403, detail="Invalid or missing API key")

# ──────────────────────────────────────────────────────────────────────────
# Pydantic models
# ──────────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    text: str
    session_id: str | None = None          # allow front‑end to resume a chat

class ChatResponse(BaseModel):
    session_id: str
    message: str
    emotion: str
    fruit: str

# ──────────────────────────────────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Slurpy RAG API", version="1.0")

# per‑user, per‑session short‑term history
History = Deque[Tuple[str, str, str]]              # (user_msg, bot_msg, emotion)
histories: Dict[tuple[str, str], History] = {}     # key = (user_id, session_id)

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    payload: ChatRequest,
    req: Request,
    _ = Depends(get_internal_api_key),          # optional API key
    user_id: str = Depends(get_clerk_user_id),  # Clerk auth
):
    # resolve / create session
    sid = payload.session_id or str(uuid.uuid4())
    key = (user_id, sid)
    hist = histories.setdefault(key, deque(maxlen=6))

    # ask Slurpy
    answer, emotion, fruit = slurpy_answer(payload.text, hist, user_id=user_id)

    return ChatResponse(
        session_id=sid,
        message=answer,
        emotion=emotion,
        fruit=fruit,
    )

@app.get("/health")
async def health():
    return {"status": "ok"}
