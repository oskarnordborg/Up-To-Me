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


class PlayCardInput(BaseModel):
    external_id: str
    idgame_card: int
    performers: List[str]


class GameInfoResponse(BaseModel):
    game: Game
    cards_in_play: List
    cards_to_play: List[GameCard]
    cards_received: List[GameCard]


@router.get("/games/")
async def get_games(external_id: str):
    games = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT email FROM appuser WHERE deleted = FALSE AND external_id = %s LIMIT 1"
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
                WHERE g.deleted = FALSE AND a.external_id = %s
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
                WHERE ga.deleted = FALSE AND a.deleted = FALSE AND ga.game = ANY(%s)
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
                WHERE deleted = FALSE AND idgame = %s
            """
            cursor.execute(query_game, (idgame,))
            game_data = cursor.fetchone()

            if not game_data:
                raise HTTPException(status_code=404, detail="Game not found")

            query_game_cards_to_play = """
                SELECT gc.*, (player.external_id = %s) AS mycard
                FROM game_card gc
                INNER JOIN appuser player ON gc.player = player.idappuser
                WHERE gc.deleted = FALSE AND player.deleted = FALSE
                AND gc.played_time IS NULL AND gc.game = %s AND player.external_id = %s
            """
            cursor.execute(query_game_cards_to_play, (external_id, idgame, external_id))
            game_cards_to_play_data = cursor.fetchall()

            game_cards_to_play = [
                GameCard.from_tuple(card_data) for card_data in game_cards_to_play_data
            ]

            query_game_cards_received = """
                SELECT gc.*, (player.external_id = %s) AS mycard
                FROM game_card gc
                INNER JOIN appuser performer ON gc.performer = performer.idappuser
                LEFT JOIN appuser player ON gc.player = player.idappuser
                WHERE gc.deleted = FALSE AND performer.deleted = FALSE
                AND gc.game = %s AND performer.external_id = %s
            """
            cursor.execute(
                query_game_cards_received, (external_id, idgame, external_id)
            )
            game_cards_received_data = cursor.fetchall()

            game_cards_received = [
                GameCard.from_tuple(card_data) for card_data in game_cards_received_data
            ]

            query_game_cards_in_play = """
                SELECT gc.*, (player.external_id = %s) AS mycard
                FROM game_card gc
                LEFT JOIN appuser performer ON gc.performer = performer.idappuser
                LEFT JOIN appuser player ON gc.player = player.idappuser
                WHERE gc.deleted = FALSE AND performer.deleted = FALSE
                AND gc.game = %s AND played_time IS NOT NULL AND finished_time IS NULL
                AND (performer.external_id = %s OR player.external_id = %s)
            """
            cursor.execute(
                query_game_cards_in_play,
                (external_id, idgame, external_id, external_id),
            )
            game_cards_in_play_data = cursor.fetchall()

            game_cards_in_play = [
                GameCard.from_tuple(card_data) for card_data in game_cards_in_play_data
            ]

            query_game_appusers = """
                SELECT email
                FROM appuser a
                INNER JOIN game_appuser ga ON a.idappuser = ga.appuser
                WHERE a.deleted = FALSE AND ga.deleted = FALSE
                AND ga.game = %s AND a.external_id != %s
            """
            cursor.execute(query_game_appusers, (idgame, external_id))
            game_appusers = cursor.fetchall()

            game_data += ([user[0] for user in game_appusers],)
            game = Game.from_tuple(game_data)

            return GameInfoResponse(
                game=game,
                cards_in_play=game_cards_in_play,
                cards_to_play=game_cards_to_play,
                cards_received=game_cards_received,
            )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")


@router.post("/game/")
async def create_game(data: CreateGameInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_query = sql.SQL(
                "SELECT idappuser FROM appuser WHERE deleted = FALSE AND external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (data.external_id,))
            idappuser = cursor.fetchone()[0]

            data.participants.append(idappuser)

            insert_game_query = sql.SQL(
                "INSERT INTO game (appuser, deck, updatedby) VALUES (%s, %s, %s) RETURNING idgame"
            )
            cursor.execute(insert_game_query, (idappuser, data.deck, idappuser))
            idgame = cursor.fetchone()[0]

            game_appuser_records = [
                (idgame, participant, participant == idappuser, idappuser)
                for participant in data.participants
            ]
            insert_game_appuser_query = """
                INSERT INTO game_appuser (game, appuser, accepted, updatedby)
                VALUES %s
            """
            execute_values(cursor, insert_game_appuser_query, game_appuser_records)

            select_card_deck_query = """
                SELECT c.title, c.description, cd.wildcard
                FROM card_deck cd
                LEFT JOIN card c ON cd.card = c.idcard
                LEFT JOIN appuser a ON cd.appuser = a.idappuser
                WHERE cd.deleted = FALSE AND (cd.card IS NULL OR c.deleted = FALSE)
                AND (cd.appuser IS NULL OR a.external_id = %s) AND cd.deck = %s
            """
            cursor.execute(select_card_deck_query, (data.external_id, data.deck))
            card_deck_data = cursor.fetchall()

            game_cards_data = [
                (idgame, appuser, wildcard, title, description, idappuser)
                for title, description, wildcard in card_deck_data
                for appuser in data.participants
            ]

            insert_game_card_query = sql.SQL(
                """
                INSERT INTO game_card (game, player, wildcard, title, description, updatedby)
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
                SET accepted = TRUE, updatedby = (SELECT idappuser FROM appuser WHERE external_id = %s)
                WHERE game_appuser.appuser = (SELECT idappuser FROM appuser WHERE external_id = %s)
                AND game_appuser.game = %s;
                """
            )
            cursor.execute(
                update_query, (data.external_id, data.external_id, data.game)
            )
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.put("/game/play-card/")
async def accept_game(data: PlayCardInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            idappuser = db_connector.get_idappuser(cursor, external_id=data.external_id)
            idperformer = db_connector.get_idappuser_by_email(
                cursor, email=data.performers[0]
            )

            update_query = sql.SQL(
                """
                UPDATE game_card
                SET updatedby = %s, played_time = CURRENT_TIMESTAMP, performer = %s
                WHERE player = %s AND idgame_card = %s and game_card.deleted = FALSE
                """
            )
            cursor.execute(
                update_query, (idappuser, idperformer, idappuser, data.idgame_card)
            )
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/game/")
async def delete_game(idgame: int, external_id: str):
    try:
        db_connector.delete_object(
            table="game", idobject=idgame, external_id=external_id
        )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
