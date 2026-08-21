import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import database


SAMPLE_TRAVEL_PLAN = {
    "departure_at": "2026-08-24T12:52",
    "arrival_at": "2026-08-24T13:40",
    "duration_minutes": 48,
    "transport_mode": "TRANSIT",
    "route_details": "博多駅 → 天神駅 → 福大前駅",
}


class TravelPlanDatabaseTest(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        database_path = Path(self.temporary_directory.name) / "test_schedule.db"
        self.database_path_patch = patch.object(
            database,
            "DATABASE_PATH",
            database_path,
        )
        self.database_path_patch.start()
        database.initialize_database()

        self.event = database.create_event(
            "福岡大学でミーティング",
            "2026-08-24T14:00",
            "2026-08-24T15:00",
            location_name="福岡大学",
            destination="福岡県福岡市城南区七隈8-19-1",
            arrival_buffer_minutes=20,
        )

    def tearDown(self):
        self.database_path_patch.stop()
        self.temporary_directory.cleanup()

    def save_sample_travel_plan(self):
        return database.save_travel_plan(
            self.event["id"],
            SAMPLE_TRAVEL_PLAN["departure_at"],
            SAMPLE_TRAVEL_PLAN["arrival_at"],
            SAMPLE_TRAVEL_PLAN["duration_minutes"],
            SAMPLE_TRAVEL_PLAN["transport_mode"],
            SAMPLE_TRAVEL_PLAN["route_details"],
        )

    def test_travel_plan_can_be_saved_and_retrieved(self):
        saved_travel_plan = self.save_sample_travel_plan()

        self.assertEqual(saved_travel_plan["event_id"], self.event["id"])
        self.assertEqual(
            database.get_travel_plan(self.event["id"]),
            saved_travel_plan,
        )

    def test_resaving_replaces_the_existing_travel_plan(self):
        first_travel_plan = self.save_sample_travel_plan()

        replaced_travel_plan = database.save_travel_plan(
            self.event["id"],
            "2026-08-24T12:45",
            "2026-08-24T13:35",
            50,
            "TRANSIT",
            "博多駅 → 薬院駅 → 福大前駅",
        )

        self.assertEqual(replaced_travel_plan["id"], first_travel_plan["id"])
        self.assertEqual(
            replaced_travel_plan["departure_at"],
            "2026-08-24T12:45",
        )

        with database.connect_database() as connection:
            travel_plan_count = connection.execute(
                "SELECT COUNT(*) FROM travel_plans WHERE event_id = ?",
                (self.event["id"],),
            ).fetchone()[0]

        self.assertEqual(travel_plan_count, 1)

    def test_travel_plan_cannot_be_saved_for_missing_event(self):
        with self.assertRaises(sqlite3.IntegrityError):
            database.save_travel_plan(
                999,
                SAMPLE_TRAVEL_PLAN["departure_at"],
                SAMPLE_TRAVEL_PLAN["arrival_at"],
                SAMPLE_TRAVEL_PLAN["duration_minutes"],
                SAMPLE_TRAVEL_PLAN["transport_mode"],
                SAMPLE_TRAVEL_PLAN["route_details"],
            )

    def test_deleting_event_also_deletes_its_travel_plan(self):
        self.save_sample_travel_plan()

        database.delete_event(self.event["id"])

        self.assertIsNone(database.get_travel_plan(self.event["id"]))


if __name__ == "__main__":
    unittest.main()
