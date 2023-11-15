from typing import List

import psycopg2
from app import db_connector
from app.api_classes import Game, GameCard
from fastapi import APIRouter, HTTPException
from psycopg2 import sql
from psycopg2.extras import execute_values
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()


class CreateGameInput(BaseModel):
    external_id: str
    deck: int
    participants: list[int]


class AcceptGameInput(BaseModel):
    external_id: str
    game: int


class GameInfoResponse(BaseModel):
    game: Game
    cards: List[GameCard]


@router.get("/games/")
async def get_games(external_id: str):
    games = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT email FROM appuser WHERE external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (external_id,))
            appuser_email = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT g.idgame, g.createdtime, a.email, d.title, ga.accepted
                FROM game AS g
                INNER JOIN game_appuser AS ga ON g.idgame = ga.game
                INNER JOIN appuser AS a ON ga.appuser = a.idappuser
                INNER JOIN deck AS d ON g.deck = d.iddeck
                WHERE a.external_id = %s
                """,
                (external_id,),
            )
            games_data = cursor.fetchall()

            game_ids = [game_data[0] for game_data in games_data]

            cursor.execute(
                """
                SELECT ga.game, array_agg(a.email)
                FROM game_appuser AS ga
                INNER JOIN appuser AS a ON ga.appuser = a.idappuser
                WHERE ga.game = ANY(%s)
                GROUP BY ga.game
                """,
                (game_ids,),
            )
            game_participants_data = cursor.fetchall()
            game_participants_dict = {
                data[0]: data[1] for data in game_participants_data
            }

            games = []

            for game_data in games_data:
                game_id = game_data[0]
                participants = game_participants_dict.get(game_id, [])
                participants = [
                    email for email in participants if email != appuser_email
                ]

                game = {
                    "idgame": game_id,
                    "createdtime": game_data[1],
                    "appuser": game_data[2],
                    "deck": game_data[3],
                    "accepted": game_data[4],
                    "participants": participants,
                }
                games.append(game)

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"games": games}


@router.get("/game/{idgame}")
async def get_game(idgame: int, external_id: str):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            # TODO: make sure the external_id has access

            query_game = """
                SELECT *
                FROM game
                WHERE idgame = %s
            """
            cursor.execute(query_game, (idgame,))
            game_data = cursor.fetchone()

            if not game_data:
                raise HTTPException(status_code=404, detail="Game not found")

            query_game_cards = """
                SELECT gc.*
                FROM game_card gc
                INNER JOIN appuser player ON gc.player = player.idappuser
                WHERE gc.game = %s AND player.external_id = %s
            """
            cursor.execute(query_game_cards, (idgame, external_id))
            game_cards_data = cursor.fetchall()

            query_game_appusers = """
                SELECT email
                FROM appuser
                INNER JOIN game_appuser ON appuser.idappuser = game_appuser.appuser
                WHERE game_appuser.game = %s AND appuser.external_id != %s
            """
            cursor.execute(query_game_appusers, (idgame, external_id))
            game_appusers = cursor.fetchall()

            game_data += ([user[0] for user in game_appusers],)
            game = Game.from_tuple(game_data)
            game_cards = [
                GameCard.from_tuple(card_data) for card_data in game_cards_data
            ]

            return GameInfoResponse(game=game, cards=game_cards)

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")


@router.post("/game/")
async def create_game(data: CreateGameInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_query = sql.SQL(
                "SELECT idappuser FROM appuser WHERE external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (data.external_id,))
            idappuser = cursor.fetchone()[0]

            data.participants.append(idappuser)

            insert_game_query = sql.SQL(
                "INSERT INTO game (appuser, deck) VALUES (%s, %s) RETURNING idgame"
            )
            cursor.execute(insert_game_query, (idappuser, data.deck))
            idgame = cursor.fetchone()[0]

            game_appuser_records = [
                (idgame, participant, participant == idappuser)
                for participant in data.participants
            ]
            insert_game_appuser_query = """
                INSERT INTO game_appuser (game, appuser, accepted)
                VALUES %s
            """
            execute_values(cursor, insert_game_appuser_query, game_appuser_records)

            select_card_deck_query = """
                SELECT c.title, c.description
                FROM card_deck cd
                INNER JOIN card c ON cd.card = c.idcard
            """
            cursor.execute(select_card_deck_query)
            card_deck_data = cursor.fetchall()

            game_cards_data = [
                (idgame, appuser, False, title, description)
                for title, description in card_deck_data
                for appuser in data.participants
            ]

            insert_game_card_query = sql.SQL(
                """
                INSERT INTO game_card (game, player, wildcard, title, description)
                VALUES %s
            """
            )
            execute_values(cursor, insert_game_card_query, game_cards_data)

            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.put("/game/accept")
async def accept_game(data: AcceptGameInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            update_query = sql.SQL(
                """
                UPDATE game_appuser
                SET accepted = TRUE
                WHERE game_appuser.appuser = (SELECT idappuser FROM appuser WHERE external_id = %s)
                AND game_appuser.game = %s;
                """
            )
            cursor.execute(update_query, (data.external_id, data.game))
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/game/")
async def delete_game(idgame: int):
    try:
        db_connector.delete_object(table="game", idobject=idgame)

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
