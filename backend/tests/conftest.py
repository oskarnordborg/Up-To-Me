from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient


@pytest.fixture
def app():
    # Create a test FastAPI app and include your router
    app = FastAPI()
    # app.include_router(router)
    return app


@pytest.fixture
def client(app):
    # Create a test client to make requests to the test app
    return AsyncClient(app=app, base_url="http://test")


@pytest.mark.asyncio
async def test_get_cards(client):
    # Test the '/cards/' GET endpoint
    response = await client.get("/cards/")
    assert response.status_code == 200
    # Perform assertions on the response JSON content


@pytest.mark.asyncio
async def test_create_card(client):
    # Test the '/card/' POST endpoint
    data = {
        "title": "Test Title",
        "description": "Test Description",
        "wildcard": False,
        "external_id": "test_external_id",
        "deck": 1,
    }
    response = await client.post("/card/", json=data)
    assert response.status_code == 200
    # Perform assertions on the response JSON content


@pytest.mark.asyncio
async def test_delete_card_deck(client):
    # Test the '/card_deck/' DELETE endpoint
    response = await client.delete(
        "/card_deck/?idcard_deck=1&external_id=test_external_id"
    )
    assert response.status_code == 200
    # Perform assertions on the response JSON content


@pytest.mark.asyncio
async def test_delete_card(client):
    # Test the '/card/' DELETE endpoint
    response = await client.delete("/card/?idcard=1&external_id=test_external_id")
    assert response.status_code == 200
    # Perform assertions on the response JSON content
