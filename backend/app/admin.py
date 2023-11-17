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


class Deck(BaseModel):
    iddeck: int
    title: str
    description: str
    created: bool = False
    updated: bool = False


class Card(BaseModel):
    idcard: int
    iddeck: int
    title: str
    description: str
    created: bool = False
    updated: bool = False


class DeleteDecksAndCards(BaseModel):
    decks: list[int]
    cards: list[int]


class DecksAndCardsUpdateInput(BaseModel):
    external_id: str
    decks: list[Deck]
    cards: list[Card]
    deletes: DeleteDecksAndCards


@router.get("/admin/decks/cards")
async def get_common_decks_and_cards(external_id: str):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT is_admin FROM appuser WHERE deleted = FALSE AND external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (external_id,))
            appuser = cursor.fetchone()

            if appuser[0] is False:
                raise HTTPException(status_code=401, detail="You are not authorized")

            get_decks_query = sql.SQL(
                "SELECT iddeck, title, description "
                "FROM deck "
                "WHERE deleted = FALSE AND appuser IS NULL "
            )
            cursor.execute(get_decks_query)
            decks_data = cursor.fetchall()
            decks_and_cards = {
                deck_data[0]: {
                    "iddeck": deck_data[0],
                    "title": deck_data[1],
                    "description": deck_data[2],
                    "cards": [],
                }
                for deck_data in decks_data
            }

            get_card_decks_query = sql.SQL(
                "SELECT d.iddeck, d.title, d.description, "
                "c.idcard, c.title, c.description "
                "FROM card_deck cd "
                "LEFT JOIN card c ON c.idcard = cd.card "
                "LEFT JOIN deck d ON d.iddeck = cd.deck "
                "WHERE cd.deleted = FALSE AND c.deleted = FALSE AND d.deleted = FALSE "
                "AND c.appuser IS NULL AND d.appuser IS NULL AND cd.appuser IS NULL "
            )
            cursor.execute(get_card_decks_query)
            cards_data = cursor.fetchall()

            for card_data in cards_data:
                card_deck = CardDeckInfo.from_tuple(card_data)
                decks_and_cards[card_deck.iddeck]["cards"].append(
                    {
                        "idcard": card_deck.idcard,
                        "title": card_deck.card_title,
                        "description": card_deck.card_description,
                    }
                )

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"decks": list(decks_and_cards.values())}


@router.post("/admin/decks/cards")
async def update_common_decks_and_cards(data: DecksAndCardsUpdateInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT is_admin, idappuser FROM appuser WHERE deleted = FALSE AND external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (data.external_id,))
            appuser = cursor.fetchone()
            if appuser[0] is False:
                raise HTTPException(status_code=401, detail="You are not authorized")
            idappuser = appuser[1]
            new_deck_ids = {}
            for deck in data.decks:
                if deck.iddeck < 0 and deck.created:
                    # Insert a new deck into the database
                    insert_query = """
                        INSERT INTO deck (title, description, createdby, updatedby)
                        VALUES (%s, %s, %s, %s) RETURNING iddeck
                    """
                    cursor.execute(
                        insert_query,
                        (deck.title, deck.description, idappuser, idappuser),
                    )
                    new_deck_id = cursor.fetchone()[0]
                    new_deck_ids[deck.iddeck] = new_deck_id

                elif deck.updated:
                    update_query = """
                        UPDATE deck SET title = %s, description = %s, updatedby = %s
                        WHERE iddeck = %s
                    """
                    cursor.execute(
                        update_query,
                        (deck.title, deck.description, deck.iddeck, idappuser),
                    )

            for card in data.cards:
                if card.idcard < 0 and card.created:
                    insert_query = """
                        INSERT INTO card (title, description, createdby, updatedby)
                        VALUES (%s, %s, %s, %s) RETURNING idcard
                    """
                    cursor.execute(
                        insert_query,
                        (card.title, card.description, idappuser, idappuser),
                    )
                    new_card_id = cursor.fetchone()[0]

                    insert_card_deck_query = """
                        INSERT INTO card_deck (card, deck, createdby, updatedby)
                        VALUES (%s, %s)
                    """
                    card.iddeck = new_deck_ids.get(card.iddeck, card.iddeck)
                    cursor.execute(
                        insert_card_deck_query,
                        (new_card_id, card.iddeck, idappuser, idappuser),
                    )

                elif card.updated:
                    update_query = """
                        UPDATE card SET title = %s, description = %s, updatedby = %s
                        WHERE idcard = %s
                    """
                    cursor.execute(
                        update_query,
                        (card.title, card.description, card.idcard, idappuser),
                    )

            if data.deletes.cards:
                delete_card_query = """
                    Update card SET deleted = TRUE, updatedby = %s
                    WHERE idcard IN %s
                """
                cursor.execute(
                    delete_card_query, (tuple(data.deletes.cards), idappuser)
                )

            if data.deletes.decks:
                delete_deck_query = """
                    Update card SET deleted = TRUE, updatedby = %s
                    WHERE iddeck IN %s
                """
                cursor.execute(
                    delete_deck_query, (tuple(data.deletes.decks), idappuser)
                )

            connection.commit()
    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
