from typing import Optional

import psycopg2
from app import db_connector
from fastapi import APIRouter, HTTPException, Query
from psycopg2 import sql
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()
GET_CARD_FIELDS = ["idcard", "title", "description"]


class CreateCardInput(BaseModel):
    title: str
    description: str
    external_id: Optional[str] = None
    deck: Optional[int] = None


def map_card(sql_card: list):
    return {
        field: sql_card[i] for i, field in enumerate(GET_CARD_FIELDS + ["usercard"])
    }


@router.get("/card/")
async def get_cards(
    external_id: Optional[str] = Query(None), iddeck: Optional[int] = Query(None)
):
    cards: list = []
    query = f"SELECT {', '.join(GET_CARD_FIELDS)}"
    params = []

    if external_id:
        query += ", (appuser.external_id IS NOT NULL) AS usercard "
        query += "FROM card LEFT JOIN card_deck ON card.idcard = card_deck.card "
        query += "LEFT JOIN appuser ON card.appuser = appuser.idappuser "
        query += "WHERE (appuser.external_id = %s OR appuser.external_id IS NULL) "
        params.append(external_id)
    else:
        query += ", false AS usercard FROM card "

    if iddeck:
        query += (" AND " if "WHERE" in query else " WHERE ") + "card_deck.deck = %s"
        params.append(iddeck)

    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            cursor.execute(query, params)
            cards = cursor.fetchall()

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"cards": [map_card(card) for card in cards]}


@router.post("/card/")
async def create_card(data: CreateCardInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT idappuser FROM appuser WHERE external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (data.external_id,))
            appuser = cursor.fetchone()
            if not appuser:
                raise HTTPException(status_code=422, detail="User not found")

            idappuser = appuser[0]
            insert_query = sql.SQL(
                "INSERT INTO card (title, description, appuser) VALUES ({}) RETURNING idcard"
            ).format(
                sql.SQL(", ").join([sql.Placeholder()] * 3),
            )

            cursor.execute(insert_query, (data.title, data.description, idappuser))
            connection.commit()
            if data.deck:
                idcard = cursor.fetchone()[0]

                insert_query = sql.SQL(
                    "INSERT INTO card_deck (card, deck, appuser) VALUES ({})"
                ).format(
                    sql.SQL(", ").join([sql.Placeholder()] * 3),
                )
                cursor.execute(insert_query, (idcard, data.deck, idappuser))
                connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/card/")
async def delete_card(idcard: int):
    try:
        db_connector.delete_object(table="card", idobject=idcard)

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
