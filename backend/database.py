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
                title TEXT NOT NULL,
                start_at TEXT,
                end_at TEXT,
                description TEXT NOT NULL DEFAULT ''
            )
            """
        )

        existing_columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(events)").fetchall()
        }
        missing_columns = {
            "start_at": "TEXT",
            "end_at": "TEXT",
            "description": "TEXT NOT NULL DEFAULT ''",
        }

        # CREATE TABLE IF NOT EXISTSだけでは既存テーブルに列が増えないため、
        # 保存済みの予定を残したまま不足している列だけを追加します。
        for column_name, column_definition in missing_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    f"ALTER TABLE events ADD COLUMN {column_name} {column_definition}"
                )

        # 以前のテーブルにある不要な列を削除し、指定された5列だけにします。
        for column_name in ("reflection", "created_at"):
            if column_name in existing_columns:
                connection.execute(f"ALTER TABLE events DROP COLUMN {column_name}")

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
            """
            SELECT id, title, start_at, end_at, description
            FROM events
            ORDER BY id
            """
        ).fetchall()

    return [dict(row) for row in rows]


def create_event(title, start_at=None, end_at=None, description=""):
    with connect_database() as connection:
        cursor = connection.execute(
            """
            INSERT INTO events (title, start_at, end_at, description)
            VALUES (?, ?, ?, ?)
            """,
            (title, start_at, end_at, description),
        )
        row = connection.execute(
            """
            SELECT id, title, start_at, end_at, description
            FROM events
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return dict(row)


def update_event(
    event_id,
    title,
    start_at=None,
    end_at=None,
    description="",
):
    with connect_database() as connection:
        cursor = connection.execute(
            """
            UPDATE events
            SET title = ?, start_at = ?, end_at = ?, description = ?
            WHERE id = ?
            """,
            (title, start_at, end_at, description, event_id),
        )
        if cursor.rowcount == 0:
            return None

        row = connection.execute(
            """
            SELECT id, title, start_at, end_at, description
            FROM events
            WHERE id = ?
            """,
            (event_id,),
        ).fetchone()

    return dict(row)


def delete_event(event_id):
    with connect_database() as connection:
        cursor = connection.execute(
            "DELETE FROM events WHERE id = ?",
            (event_id,),
        )

    return cursor.rowcount > 0
