from typing import Optional

import psycopg2
from app import card, db_connector
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


@router.get("/deck/")
async def get_decks(external_id: Optional[str] = Query(None)):
    decks: list = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            query = (
                f"SELECT {', '.join(GET_DECK_FIELDS)}, "
                "(appuser.external_id IS NOT NULL) AS userdeck "
                "FROM deck LEFT JOIN appuser ON deck.appuser = appuser.idappuser"
            )
            if external_id:
                query += " WHERE appuser IS NULL OR appuser.external_id = %s"
                cursor.execute(query, (external_id,))
            else:
                query += " WHERE appuser IS NULL"
                cursor.execute(query)
            print(query)
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
            }
            for deck in decks
        ]
    }


@router.get("/deck/cards")
async def get_deck(iddeck: int):
    decks: list = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            delete_query = sql.SQL(
                "SELECT iddeck, email, firstname, lastname FROM deck WHERE iddeck = %s LIMIT 1"
            )
            card.map_card()
            cursor.execute(delete_query, (iddeck,))
            decks = cursor.fetchone()

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")
    return (
        {
            "iddeck": decks[0][0],
            "email": decks[0][1],
            "firstname": decks[0][2],
            "lastname": decks[0][3],
        }
        if len(decks)
        else {}
    )


@router.post("/deck/")
async def create_deck(data: CreateDeckInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            print(data.external_id)
            get_query = sql.SQL(
                "SELECT idappuser FROM appuser WHERE external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (data.external_id,))
            appuser = cursor.fetchone()
            print(appuser)
            if not appuser:
                raise HTTPException(status_code=422, detail="User not found")

            idappuser = appuser[0]
            insert_query = sql.SQL(
                "INSERT INTO deck (title, description, appuser) VALUES ({}) RETURNING iddeck"
            ).format(
                sql.SQL(", ").join([sql.Placeholder()] * 3),
            )

            cursor.execute(insert_query, (data.title, data.description, idappuser))
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/deck/")
async def delete_deck(iddeck: int):
    try:
        db_connector.delete_object(table="deck", idobject=iddeck)

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
