
from fastapi import FastAPI
from pydantic import BaseModel
from rag_core import slurpy_answer

class Message(BaseModel):
    text: str

app = FastAPI(title="Slurpy API")

@app.post("/chat")
async def chat(msg: Message):
    return slurpy_answer(msg.text)
