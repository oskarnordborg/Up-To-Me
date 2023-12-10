import os


def test_create_friendship(db_connection, test_app):
    test_app.post(
        "/friendship/create",
        json={"external_id": "123", "username": "user123"},
        headers={"x-api-key": os.environ["X_API_KEY"]},
    )
