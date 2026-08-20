from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    create_event,
    delete_event,
    get_all_events,
    initialize_database,
    update_event,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


class EventCreate(BaseModel):
    title: str
    start_at: str | None = None
    end_at: str | None = None
    description: str = ""


class Event(BaseModel):
    id: int
    title: str
    start_at: str | None
    end_at: str | None
    description: str


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

    return create_event(
        title,
        event.start_at,
        event.end_at,
        event.description,
    )


@app.put("/api/events/{event_id}", response_model=Event)
def edit_event(event_id: int, event: EventCreate):
    title = event.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="予定タイトルを入力してください")

    updated_event = update_event(
        event_id,
        title,
        event.start_at,
        event.end_at,
        event.description,
    )
    if updated_event is None:
        raise HTTPException(status_code=404, detail="予定が見つかりません")

    return updated_event


@app.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_event(event_id: int):
    if not delete_event(event_id):
        raise HTTPException(status_code=404, detail="予定が見つかりません")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
