import psycopg2
from app import db_connector
from fastapi import APIRouter, HTTPException
from psycopg2 import sql
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()
GET_CARD_FIELDS = ["idcard", "title", "description"]


class CreateCardInput(BaseModel):
    title: str
    description: str


def map_card(sql_card: list):
    return {field: sql_card[i] for i, field in enumerate(GET_CARD_FIELDS)}


@router.get("/card/")
async def get_cards():
    cards: list = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            cursor.execute(f"SELECT {', '.join(GET_CARD_FIELDS)} FROM card")
            cards = cursor.fetchall()

    except (Exception, psycopg2.Error) as error:
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"cards": [map_card(card) for card in cards]}


@router.post("/card/")
async def create_card(data: CreateCardInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            insert_query = sql.SQL(
                "INSERT INTO card (title, description) VALUES ({})"
            ).format(
                sql.SQL(", ").join([sql.Placeholder()] * 2),
            )

            cursor.execute(insert_query, (data.title, data.description))
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/card/")
async def delete_card(idcard: int):
    try:
        db_connector.delete_object(table="card", idobject=idcard)

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
