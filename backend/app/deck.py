import psycopg2
from fastapi import APIRouter
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()


class CreateDeckInput(BaseModel):
    title: str
    description: str


@router.get("/deck/")
async def get_decks():
    decks: list = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT title, description FROM deck")
            decks = cursor.fetchall()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
    return {
        "decks": [
            {
                "title": deck[0],
                "description": deck[1],
            }
            for deck in decks
        ]
    }


@router.post("/deck/")
async def register(data: CreateDeckInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            cursor.execute(
                f"INSERT INTO deck(title, description) VALUES (%s, %s)",
                data.title,
                data.description,
            )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)

    return {"success": True}
