import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).with_name("schedule.db")


def connect_database():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with connect_database() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                start_at TEXT,
                end_at TEXT,
                description TEXT NOT NULL DEFAULT '',
                location_name TEXT,
                destination TEXT,
                arrival_buffer_minutes INTEGER
            )
            """)

        existing_columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(events)").fetchall()
        }
        missing_columns = {
            "start_at": "TEXT",
            "end_at": "TEXT",
            "description": "TEXT NOT NULL DEFAULT ''",
            "location_name": "TEXT",
            "destination": "TEXT",
            "arrival_buffer_minutes": "INTEGER",
        }

        # CREATE TABLE IF NOT EXISTSだけでは既存テーブルに列が増えないため、
        # 保存済みの予定を残したまま不足している列だけを追加します。
        for column_name, column_definition in missing_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    f"ALTER TABLE events ADD COLUMN {column_name} {column_definition}"
                )

        # 以前のテーブルに残っている、現在使用しない列を削除します。
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
                completed INTEGER NOT NULL DEFAULT 0
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY,
                origin_name TEXT NOT NULL,
                origin_address TEXT NOT NULL
            )
            """
        )


def get_all_events():
    with connect_database() as connection:
        rows = connection.execute("""
            SELECT
                id,
                title,
                start_at,
                end_at,
                description,
                location_name,
                destination,
                arrival_buffer_minutes
            FROM events
            ORDER BY id
            """).fetchall()

    return [dict(row) for row in rows]


def create_event(
    title,
    start_at=None,
    end_at=None,
    description="",
    location_name=None,
    destination=None,
    arrival_buffer_minutes=None,
):
    with connect_database() as connection:
        cursor = connection.execute(
            """
            INSERT INTO events (
                title,
                start_at,
                end_at,
                description,
                location_name,
                destination,
                arrival_buffer_minutes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                title,
                start_at,
                end_at,
                description,
                location_name,
                destination,
                arrival_buffer_minutes,
            ),
        )
        row = connection.execute(
            """
            SELECT
                id,
                title,
                start_at,
                end_at,
                description,
                location_name,
                destination,
                arrival_buffer_minutes
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
    location_name=None,
    destination=None,
    arrival_buffer_minutes=None,
):
    with connect_database() as connection:
        cursor = connection.execute(
            """
            UPDATE events
            SET
                title = ?,
                start_at = ?,
                end_at = ?,
                description = ?,
                location_name = ?,
                destination = ?,
                arrival_buffer_minutes = ?
            WHERE id = ?
            """,
            (
                title,
                start_at,
                end_at,
                description,
                location_name,
                destination,
                arrival_buffer_minutes,
                event_id,
            ),
        )
        if cursor.rowcount == 0:
            return None

        row = connection.execute(
            """
            SELECT
                id,
                title,
                start_at,
                end_at,
                description,
                location_name,
                destination,
                arrival_buffer_minutes
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


def get_all_tasks():
    with connect_database() as connection:
        rows = connection.execute(
            """
            SELECT id, title, due_at, description, completed
            FROM tasks
            ORDER BY id
            """
        ).fetchall()

    return [dict(row) for row in rows]


def create_task(title, due_at=None, description=""):
    with connect_database() as connection:
        cursor = connection.execute(
            """
            INSERT INTO tasks (title, due_at, description)
            VALUES (?, ?, ?)
            """,
            (title, due_at, description),
        )
        row = connection.execute(
            """
            SELECT id, title, due_at, description, completed
            FROM tasks
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return dict(row)


def update_task(task_id, title, due_at, description, completed):
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
            SELECT id, title, due_at, description, completed
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


def get_origin_setting():
    with connect_database() as connection:
        row = connection.execute(
            """
            SELECT id, origin_name, origin_address
            FROM settings
            WHERE id = 1
            """
        ).fetchone()

    if row is None:
        return None

    return dict(row)


def save_origin_setting(origin_name, origin_address):
    with connect_database() as connection:
        connection.execute(
            """
            INSERT INTO settings (id, origin_name, origin_address)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                origin_name = excluded.origin_name,
                origin_address = excluded.origin_address
            """,
            (origin_name, origin_address),
        )
        row = connection.execute(
            """
            SELECT id, origin_name, origin_address
            FROM settings
            WHERE id = 1
            """
        ).fetchone()

    return dict(row)
