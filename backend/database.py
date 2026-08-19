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
