from typing import Optional

import psycopg2
from app import db_connector
from fastapi import APIRouter, HTTPException, Query
from psycopg2 import sql
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()
GET_CARD_FIELDS = ["idcard_deck", "title", "description"]


class CreateCardInput(BaseModel):
    title: str
    description: str
    wildcard: bool
    external_id: Optional[str] = None
    deck: Optional[int] = None


def map_card(sql_card: list):
    print(sql_card)
    return {
        field: sql_card[i]
        for i, field in enumerate(GET_CARD_FIELDS + ["usercard", "wildcard"])
    }


@router.get("/cards/")
async def get_cards(
    external_id: Optional[str] = Query(None), iddeck: Optional[int] = Query(None)
):
    cards: list = []
    query = f"SELECT {', '.join(GET_CARD_FIELDS)}"
    params = []

    if external_id:
        query += ", (appuser.external_id IS NOT NULL) AS usercard, cd.wildcard "
        query += "FROM card_deck cd "
        query += "LEFT JOIN card ON card.idcard = cd.card "
        query += "LEFT JOIN appuser ON cd.appuser = appuser.idappuser "
        query += "WHERE (appuser.external_id = %s OR card.appuser IS NULL) "
        params.append(external_id)
    else:
        query += ", false AS usercard FROM card "

    if iddeck:
        query += (" AND " if "WHERE" in query else " WHERE ") + "cd.deck = %s "
        params.append(iddeck)

    query += (
        " AND " if "WHERE" in query else " WHERE "
    ) + "(cd.card IS NULL OR card.deleted = FALSE) AND cd.deleted = FALSE "

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
            if not data.wildcard:
                insert_query = sql.SQL(
                    "INSERT INTO card (title, description, appuser, updatedby) VALUES ({}) RETURNING idcard"
                ).format(
                    sql.SQL(", ").join([sql.Placeholder()] * 4),
                )

                cursor.execute(
                    insert_query,
                    (data.title, data.description, idappuser, idappuser),
                )
                connection.commit()
            if data.deck:
                idcard = cursor.fetchone()[0] if not data.wildcard else None

                insert_query = sql.SQL(
                    "INSERT INTO card_deck (card, deck, wildcard, appuser, updatedby) VALUES ({})"
                ).format(
                    sql.SQL(", ").join([sql.Placeholder()] * 5),
                )
                cursor.execute(
                    insert_query,
                    (idcard, data.deck, data.wildcard, idappuser, idappuser),
                )
                connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/card_deck/")
async def delete_card(idcard_deck: int, external_id: str):
    try:
        db_connector.delete_object(
            table="card_deck", idobject=idcard_deck, external_id=external_id
        )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/card/")
async def delete_card(idcard: int, external_id: str):
    try:
        db_connector.delete_object(
            table="card", idobject=idcard, external_id=external_id
        )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
