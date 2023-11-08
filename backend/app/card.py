import psycopg2
from fastapi import APIRouter
from psycopg2 import sql
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()


class CreateCardInput(BaseModel):
    title: str
    description: str


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


@router.post("/card/")
async def create_card(data: CreateCardInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            insert_query = sql.SQL("INSERT INTO card ({}) VALUES ({})").format(
                sql.SQL(", ").join(
                    [sql.Identifier(column) for column in ["title", "description"]]
                ),
                sql.SQL(", ").join([sql.Placeholder()] * 2),
            )

            cursor.execute(insert_query, (data.title, data.description))
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        return {"error": f"Error connecting to PostgreSQL: {str(error)}"}

    return {"success": True}
