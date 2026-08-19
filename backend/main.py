from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import create_event, get_all_events, initialize_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class EventCreate(BaseModel):
    title: str


class Event(BaseModel):
    id: int
    title: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/events", response_model=list[Event])
def read_events():
    return get_all_events()


@app.post("/api/events", response_model=Event, status_code=status.HTTP_201_CREATED)
def add_event(event: EventCreate):
    title = event.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="予定タイトルを入力してください")

    return create_event(title)
