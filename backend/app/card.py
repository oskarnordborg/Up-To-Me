import psycopg2
from fastapi import APIRouter

from . import db_connection_params

router = APIRouter()


@router.get("/card/")
async def get_cards():
    cards: list = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT title, description FROM card")
            cards = cursor.fetchall()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
    return {
        "cards": [
            {
                "title": card[0],
                "description": card[1],
            }
            for card in cards
        ]
    }
