import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).with_name("schedule.db")


def connect_database():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with connect_database() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                due_at TEXT,
                description TEXT NOT NULL DEFAULT '',
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def get_all_events():
    with connect_database() as connection:
        rows = connection.execute(
            "SELECT id, title FROM events ORDER BY id"
        ).fetchall()

    return [dict(row) for row in rows]


def create_event(title):
    with connect_database() as connection:
        cursor = connection.execute(
            "INSERT INTO events (title) VALUES (?)",
            (title,),
        )

    return {"id": cursor.lastrowid, "title": title}


def get_all_tasks():
    with connect_database() as connection:
        rows = connection.execute(
            """
            SELECT id, title, due_at, description, completed, created_at
            FROM tasks
            ORDER BY id
            """
        ).fetchall()

    return [dict(row) for row in rows]


def create_task(title, due_at=None, description="", completed=False):
    with connect_database() as connection:
        cursor = connection.execute(
            """
            INSERT INTO tasks (title, due_at, description, completed)
            VALUES (?, ?, ?, ?)
            """,
            (title, due_at, description, completed),
        )
        row = connection.execute(
            """
            SELECT id, title, due_at, description, completed, created_at
            FROM tasks
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return dict(row)


def update_task(task_id, title, due_at=None, description="", completed=False):
    with connect_database() as connection:
        cursor = connection.execute(
            """
            UPDATE tasks
            SET title = ?, due_at = ?, description = ?, completed = ?
            WHERE id = ?
            """,
            (title, due_at, description, completed, task_id),
        )
        if cursor.rowcount == 0:
            return None

        row = connection.execute(
            """
            SELECT id, title, due_at, description, completed, created_at
            FROM tasks
            WHERE id = ?
            """,
            (task_id,),
        ).fetchone()

    return dict(row)


def delete_task(task_id):
    with connect_database() as connection:
        cursor = connection.execute(
            "DELETE FROM tasks WHERE id = ?",
            (task_id,),
        )

    return cursor.rowcount > 0
