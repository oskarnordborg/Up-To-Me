from typing import Optional

import psycopg2
from app import card, db_connector
from app.api_classes import CardDeckInfo
from fastapi import APIRouter, HTTPException, Query
from psycopg2 import sql
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()

GET_DECK_FIELDS = ["iddeck", "title", "description"]


class CreateDeckInput(BaseModel):
    title: str
    description: str
    external_id: str


@router.get("/decks/")
async def get_decks(external_id: Optional[str] = Query(None)):
    decks: list = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            query = (
                f"SELECT {', '.join(GET_DECK_FIELDS)}, "
                "(appuser.external_id IS NOT NULL) AS userdeck, "
                "(SELECT COUNT(1) FROM card_deck WHERE card_deck.deck = deck.iddeck "
                "AND card_deck.deleted = FALSE) AS cardcount "
                "FROM deck LEFT JOIN appuser ON deck.appuser = appuser.idappuser "
            )
            if external_id:
                query += "WHERE deck.deleted = FALSE AND appuser IS NULL OR appuser.external_id = %s"
                cursor.execute(query, (external_id,))
            else:
                query += "WHERE deck.deleted = FALSE AND appuser IS NULL"
                cursor.execute(query)

            decks = cursor.fetchall()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
    return {
        "decks": [
            {
                "iddeck": deck[0],
                "title": deck[1],
                "description": deck[2],
                "userdeck": deck[3],
                "cardcount": deck[4],
            }
            for deck in decks
        ]
    }


@router.post("/deck/")
async def create_deck(data: CreateDeckInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT idappuser FROM appuser WHERE deleted = FALSE AND external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (data.external_id,))
            appuser = cursor.fetchone()

            if not appuser:
                raise HTTPException(status_code=422, detail="User not found")

            idappuser = appuser[0]
            insert_query = sql.SQL(
                "INSERT INTO deck (title, description, appuser, updatedby) VALUES ({}) RETURNING iddeck"
            ).format(
                sql.SQL(", ").join([sql.Placeholder()] * 4),
            )

            cursor.execute(
                insert_query,
                (data.title, data.description, idappuser, idappuser, idappuser),
            )
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/deck/")
async def delete_deck(iddeck: int, external_id: str):
    try:
        db_connector.delete_object(
            table="deck", idobject=iddeck, external_id=external_id
        )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
