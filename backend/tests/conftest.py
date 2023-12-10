import sqlite3
from unittest import mock
from unittest.mock import MagicMock

import pytest
from app.api import app
from fastapi.testclient import TestClient


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
        cursor.execute(
            """
            CREATE TABLE appuser (
                idappuser serial PRIMARY KEY,
                createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                external_id VARCHAR(256),
                onesignal_id VARCHAR(256) DEFAULT NULL,
                username VARCHAR ( 256 ) DEFAULT '',
                email VARCHAR ( 256 ) DEFAULT '',
                firstname VARCHAR ( 256 ) DEFAULT '',
                lastname VARCHAR ( 256 ) DEFAULT '',
                is_admin BOOLEAN DEFAULT FALSE,
                deleted BOOL DEFAULT FALSE
            );
        """
        )

        cursor.execute(
            """
            CREATE TABLE friendship (
                idfriendship SERIAL PRIMARY KEY,
                createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted BOOL DEFAULT FALSE,
                appuser1 INT REFERENCES appuser(idappuser),
                appuser2 INT REFERENCES appuser(idappuser),
                accepted BOOL DEFAULT FALSE
            );
        """
        )

        cursor.execute(
            "INSERT INTO appuser (external_id, username) VALUES (?, ?)",
            ("sample_id", "sample_user"),
        )
        cursor.execute(
            "INSERT INTO friendship (appuser1, appuser2) VALUES (?, ?)", (1, 2)
        )

        conn.commit()
        return conn

    session_monkeypatch.setattr("psycopg2.connect", mock_connect)
