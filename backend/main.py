from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    create_event,
    create_task,
    delete_event,
    delete_task,
    get_all_events,
    get_all_tasks,
    get_origin_setting,
    initialize_database,
    save_origin_setting,
    update_event,
    update_task,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Ryuute", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


class EventCreate(BaseModel):
    title: str
    start_at: str
    end_at: str
    description: str = ""
    location_name: str | None = None
    destination: str | None = None
    arrival_buffer_minutes: int | None = None


class Event(BaseModel):
    id: int
    title: str
    start_at: str | None
    end_at: str | None
    description: str
    location_name: str | None
    destination: str | None
    arrival_buffer_minutes: int | None


class TaskCreate(BaseModel):
    title: str
    due_at: str | None = None
    description: str = ""


class TaskUpdate(BaseModel):
    title: str
    due_at: str | None
    description: str
    completed: bool


class Task(BaseModel):
    id: int
    title: str
    due_at: str | None
    description: str
    completed: bool


class OriginSettingUpdate(BaseModel):
    origin_name: str
    origin_address: str


class OriginSetting(BaseModel):
    id: int
    origin_name: str
    origin_address: str


def validate_event_times(start_at: str, end_at: str):
    try:
        start_datetime = datetime.strptime(start_at, "%Y-%m-%dT%H:%M")
        end_datetime = datetime.strptime(end_at, "%Y-%m-%dT%H:%M")
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail="日時はYYYY-MM-DDTHH:mm形式で入力してください",
        ) from error

    if end_datetime < start_datetime:
        raise HTTPException(
            status_code=400,
            detail="終了日時は開始日時以降にしてください",
        )


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/settings/origin", response_model=OriginSetting)
def read_origin_setting():
    origin_setting = get_origin_setting()
    if origin_setting is None:
        raise HTTPException(status_code=404, detail="出発地点が設定されていません")

    return origin_setting


@app.put("/api/settings/origin", response_model=OriginSetting)
def edit_origin_setting(origin_setting: OriginSettingUpdate):
    origin_name = origin_setting.origin_name.strip()
    if not origin_name:
        raise HTTPException(status_code=400, detail="出発地点の表示名を入力してください")

    origin_address = origin_setting.origin_address.strip()
    if not origin_address:
        raise HTTPException(status_code=400, detail="出発地点の住所または駅名を入力してください")

    return save_origin_setting(origin_name, origin_address)


@app.get("/api/events", response_model=list[Event])
def read_events():
    return get_all_events()


@app.post("/api/events", response_model=Event, status_code=status.HTTP_201_CREATED)
def add_event(event: EventCreate):
    title = event.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="予定タイトルを入力してください")

    validate_event_times(event.start_at, event.end_at)

    return create_event(
        title,
        event.start_at,
        event.end_at,
        event.description,
        event.location_name,
        event.destination,
        event.arrival_buffer_minutes,
    )


@app.put("/api/events/{event_id}", response_model=Event)
def edit_event(event_id: int, event: EventCreate):
    title = event.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="予定タイトルを入力してください")

    validate_event_times(event.start_at, event.end_at)

    updated_event = update_event(
        event_id,
        title,
        event.start_at,
        event.end_at,
        event.description,
        event.location_name,
        event.destination,
        event.arrival_buffer_minutes,
    )
    if updated_event is None:
        raise HTTPException(status_code=404, detail="予定が見つかりません")

    return updated_event


@app.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_event(event_id: int):
    if not delete_event(event_id):
        raise HTTPException(status_code=404, detail="予定が見つかりません")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/tasks", response_model=list[Task])
def read_tasks():
    return get_all_tasks()


@app.post("/api/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def add_task(task: TaskCreate):
    title = task.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="タスクタイトルを入力してください")

    return create_task(title, task.due_at, task.description)


@app.put("/api/tasks/{task_id}", response_model=Task)
def edit_task(task_id: int, task: TaskUpdate):
    title = task.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="タスクタイトルを入力してください")

    updated_task = update_task(
        task_id,
        title,
        task.due_at,
        task.description,
        task.completed,
    )
    if updated_task is None:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")

    return updated_task


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_task(task_id: int):
    if not delete_task(task_id):
        raise HTTPException(status_code=404, detail="タスクが見つかりません")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
