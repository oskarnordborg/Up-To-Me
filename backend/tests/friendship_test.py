import os


def test_create_friendship_external_id_not_found(db_connection, test_app):
    resp = test_app.post(
        "/friendship/create",
        json={"external_id": "123", "username": "sample_user2"},
        headers={"x-api-key": os.environ["X_API_KEY"]},
    )
    assert resp.status_code == 404


def test_create_friendship_username_not_found(db_connection, test_app):
    resp = test_app.post(
        "/friendship/create",
        json={"external_id": "sample_id", "username": "sample_user3"},
        headers={"x-api-key": os.environ["X_API_KEY"]},
    )
    assert resp.status_code == 404


def test_create_friendship_created(db_connection, test_app):
    resp = test_app.post(
        "/friendship/create",
        json={"external_id": "sample_id", "username": "sample_user2"},
        headers={"x-api-key": os.environ["X_API_KEY"]},
    )
    assert resp.status_code == 200
