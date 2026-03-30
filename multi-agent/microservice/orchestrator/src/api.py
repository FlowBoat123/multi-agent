from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from src.consumer import run

load_dotenv()

app = FastAPI(title='Multi-Agent Orchestrator API', version='1.0.0')


class ChatRequest(BaseModel):
    conversation_history: Optional[List[Dict[str, Any]]] = None
    conversationId: str = Field(min_length=1)
    message: str = Field(min_length=1)
    model: Optional[str] = None
    userId: Optional[str] = None


class ChatResponse(BaseModel):
    context: Optional[str] = None
    conversationId: str
    message: str


@app.get('/health')
async def health_check():
    return {'status': 'ok'}


@app.post('/chat', response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        result = await run(req.message, req.conversationId, req.conversation_history)

        return ChatResponse(
            context=result.get('context', ''),
            conversationId=req.conversationId,
            message=result.get('response', ''),
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error