import sqlite3
from unittest import mock
from unittest.mock import MagicMock

import pytest
from app.api import app
from fastapi.testclient import TestClient

from . import db_mock


@pytest.fixture(scope="function")
def test_app(db_connection, session_monkeypatch):
    yield TestClient(app)


@pytest.fixture(scope="session")
def session_monkeypatch(request):
    # Create a session-scoped monkeypatch
    from _pytest.monkeypatch import MonkeyPatch

    monkeypatch = MonkeyPatch()
    yield monkeypatch
    monkeypatch.undo()


@pytest.fixture(scope="session")
def db_connection(session_monkeypatch):
    def mock_sql(*args):
        return args[0].replace("%s", "?")

    session_monkeypatch.setattr("psycopg2.sql.SQL", mock_sql)

    def mock_connect(**kwargs):
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        for table_query in db_mock.tables:
            cursor.execute(table_query)

        cursor.execute(
            "INSERT INTO appuser (external_id, username) VALUES (?, ?)",
            ("sample_id", "sample_user"),
        )
        cursor.execute(
            "INSERT INTO appuser (external_id, username) VALUES (?, ?)",
            ("sample_id2", "sample_user2"),
        )
        conn.commit()
        return conn

    session_monkeypatch.setattr("psycopg2.connect", mock_connect)

    def mock_onesignal(*args):
        return

    session_monkeypatch.setattr(
        "app.helpers.onesignal_helper.send_notification_to_users", mock_onesignal
    )
