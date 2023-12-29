import random
from enum import Enum
from typing import List

import psycopg2
from app import db_connector
from app.api_classes import Game, GameCard
from app.helpers import onesignal_helper
from fastapi import APIRouter, HTTPException
from psycopg2 import sql
from psycopg2.extras import execute_values
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()


class GameModeEnum(str, Enum):
    all = "all"
    deal = "deal"


class CreateGameInput(BaseModel):
    external_id: str
    deck: int
    participants: list[int]
    wildcards: int
    skips: int
    cardsperperson: int = None
    gamemode: GameModeEnum


class AcceptGameInput(BaseModel):
    external_id: str
    game: int


class PlayCardInput(BaseModel):
    external_id: str
    idgame_card: int
    title: str = ""
    description: str = ""
    external_id: str
    performers: List[str]


class CardActionInput(BaseModel):
    external_id: str
    idgame_card: int


class GameInfoResponse(BaseModel):
    game: Game
    cards_in_play: List
    cards_to_play: List[GameCard]
    cards_done: List[GameCard]


@router.get("/games/")
async def get_games(external_id: str):
    games = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT username FROM appuser WHERE deleted = FALSE AND external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (external_id,))
            appuser_username = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT g.idgame, g.createdtime, a.username, d.title, ga.accepted,
                EXISTS (
                    SELECT 1
                    FROM game_card gc
                    WHERE gc.game = g.idgame
                        AND gc.performer = (
                            SELECT idappuser
                            FROM appuser
                            WHERE external_id = %s
                            LIMIT 1
                        )
                        AND gc.played_time IS NOT NULL
                        AND gc.finished_time IS NULL
                )
                FROM game AS g
                INNER JOIN game_appuser AS ga ON g.idgame = ga.game
                INNER JOIN appuser AS a ON ga.appuser = a.idappuser
                INNER JOIN deck AS d ON g.deck = d.iddeck
                WHERE g.deleted = FALSE AND a.external_id = %s
                """,
                (external_id, external_id),
            )
            games_data = cursor.fetchall()

            game_ids = [game_data[0] for game_data in games_data]

            cursor.execute(
                """
                SELECT ga.game, array_agg(a.username)
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
                    username
                    for username in participants
                    if username != appuser_username
                ]

                game = {
                    "idgame": game_id,
                    "createdtime": game_data[1],
                    "appuser": game_data[2],
                    "deck": game_data[3],
                    "accepted": game_data[4],
                    "card_waiting": game_data[5],
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
            query_game = """
                SELECT *
                FROM game
                WHERE deleted = FALSE AND idgame = %s
            """
            cursor.execute(query_game, (idgame,))
            game_data = cursor.fetchone()

            if not game_data:
                raise HTTPException(status_code=404, detail="Game not found")

            get_query = """
                SELECT ga.accepted
                FROM appuser a
                INNER JOIN game_appuser ga ON a.idappuser = ga.appuser
                WHERE a.deleted = FALSE AND ga.deleted = FALSE
                AND ga.game = %s AND a.external_id = %s
            """
            cursor.execute(get_query, (idgame, external_id))
            appuser = cursor.fetchone()

            if not appuser:
                raise HTTPException(status_code=401, detail="User not in game")
            appuser_accepted = appuser[0]

            query_game_cards_to_play = """
                SELECT gc.*, (player.external_id = %s) AS mycard
                FROM game_card gc
                INNER JOIN appuser player ON gc.player = player.idappuser
                WHERE gc.deleted = FALSE AND player.deleted = FALSE
                AND gc.played_time IS NULL AND gc.game = %s AND player.external_id = %s
                AND gc.skipped = FALSE
            """
            cursor.execute(query_game_cards_to_play, (external_id, idgame, external_id))
            game_cards_to_play_data = cursor.fetchall()

            game_cards_to_play = [
                GameCard.from_tuple(card_data) for card_data in game_cards_to_play_data
            ]

            query_game_cards_done = """
                SELECT gc.*, (player.external_id = %s) AS mycard,
                CONCAT(performer.firstname, ' ', LEFT(performer.lastname, 1))
                FROM game_card gc
                INNER JOIN appuser performer ON gc.performer = performer.idappuser
                LEFT JOIN appuser player ON gc.player = player.idappuser
                WHERE gc.deleted = FALSE AND performer.deleted = FALSE AND gc.game = %s
                AND (finished_time IS NOT NULL OR gc.skipped = TRUE)
                AND (player.external_id = %s OR performer.external_id = %s)
            """
            cursor.execute(
                query_game_cards_done,
                (external_id, idgame, external_id, external_id),
            )
            game_cards_done_data = cursor.fetchall()

            game_cards_done = [
                GameCard.from_tuple(card_data) for card_data in game_cards_done_data
            ]

            query_game_cards_in_play = """
                SELECT gc.*, (player.external_id = %s) AS mycard,
                CONCAT(performer.firstname, ' ', LEFT(performer.lastname, 1))
                FROM game_card gc
                LEFT JOIN appuser performer ON gc.performer = performer.idappuser
                LEFT JOIN appuser player ON gc.player = player.idappuser
                WHERE gc.deleted = FALSE AND performer.deleted = FALSE
                AND gc.game = %s AND played_time IS NOT NULL AND finished_time IS NULL
                AND gc.skipped = FALSE
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
                SELECT username, CONCAT(firstname, ' ', lastname), ga.accepted,
                ga.skips_left
                FROM appuser a
                INNER JOIN game_appuser ga ON a.idappuser = ga.appuser
                WHERE a.deleted = FALSE AND ga.deleted = FALSE
                AND ga.game = %s AND a.external_id != %s
            """
            cursor.execute(query_game_appusers, (idgame, external_id))
            game_appusers = cursor.fetchall()

            game_data += (
                {
                    user[0]: {
                        "name": user[1],
                        "accepted": user[2],
                        "skips_left": user[3],
                    }
                    for user in game_appusers
                },
            )
            game = Game.from_tuple(game_data)

            game.started = all([part.accepted for part in game.participants.values()])
            return GameInfoResponse(
                game=game,
                cards_in_play=game_cards_in_play,
                cards_to_play=game_cards_to_play,
                cards_done=game_cards_done,
            )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")


def list_batches(gamemode, lst, num_batches, batch_size=None):
    if gamemode == GameModeEnum.all:
        return [list(lst) for _ in range(num_batches)]
    elif gamemode == GameModeEnum.deal:
        random.shuffle(lst)
        batch_size = len(lst) // num_batches if not batch_size else batch_size
        batches = [
            lst[i * batch_size : (i + 1) * batch_size] for i in range(num_batches)
        ]
        return batches


@router.post("/game/")
async def create_game(data: CreateGameInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_query = sql.SQL(
                """
                SELECT idappuser, username FROM appuser
                WHERE deleted = FALSE AND external_id = %s LIMIT 1
                """
            )
            cursor.execute(get_query, (data.external_id,))
            idappuser, username = cursor.fetchone()

            data.participants.append(idappuser)

            insert_game_query = sql.SQL(
                """
                INSERT INTO game (
                    appuser, deck, updatedby, wildcards_count, skips_count
                )
                VALUES (%s, %s, %s, %s, %s) RETURNING idgame
                """
            )
            cursor.execute(
                insert_game_query,
                (idappuser, data.deck, idappuser, data.wildcards, data.skips),
            )
            idgame = cursor.fetchone()[0]

            game_appuser_records = [
                (
                    idgame,
                    participant,
                    participant == idappuser,
                    idappuser,
                    data.skips,
                )
                for participant in data.participants
            ]
            insert_game_appuser_query = """
                INSERT INTO game_appuser (
                    game, appuser, accepted, updatedby, skips_left
                )
                VALUES %s
            """
            execute_values(cursor, insert_game_appuser_query, game_appuser_records)

            select_card_deck_query = """
                SELECT COALESCE(c.title, ''), COALESCE(c.description, ''), FALSE, c.idcard
                FROM card_deck cd
                LEFT JOIN card c ON cd.card = c.idcard
                LEFT JOIN appuser a ON cd.appuser = a.idappuser
                WHERE cd.deleted = FALSE AND (cd.card IS NULL OR c.deleted = FALSE)
                AND (cd.appuser IS NULL OR a.external_id = %s) AND cd.deck = %s
            """
            cursor.execute(select_card_deck_query, (data.external_id, data.deck))
            card_deck_data = cursor.fetchall()

            batched_cards = list_batches(
                data.gamemode,
                card_deck_data,
                len(data.participants),
                data.cardsperperson,
            )

            for batch in batched_cards:
                for _ in range(data.wildcards):
                    batch.append(("", "", True, None))

            game_cards_data = [
                (idgame, appuser, wildcard, idcard, title, description, idappuser)
                for index, appuser in enumerate(data.participants)
                for title, description, wildcard, idcard in batched_cards[index]
            ]

            insert_game_card_query = sql.SQL(
                """
                INSERT INTO game_card (
                    game, player, wildcard, card, title, description, updatedby
                )
                VALUES %s
                """
            )
            execute_values(cursor, insert_game_card_query, game_cards_data)

            connection.commit()

            invited_onesignal_ids = [
                part for part in data.participants if part != idappuser
            ]
            get_query = sql.SQL(
                """
                SELECT onesignal_id FROM appuser
                WHERE idappuser IN %s AND onesignal_id IS NOT NULL AND onesignal_id <> ''
                """
            )
            cursor.execute(get_query, (tuple(invited_onesignal_ids),))
            receivers = [a[0] for a in cursor.fetchall()]
            onesignal_helper.send_notification_to_users(
                receivers, f"{username} wants to play!"
            )

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
async def play_card(data: PlayCardInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            idappuser, player_username = db_connector.get_appuser(
                cursor, external_id=data.external_id
            )
            idperformer, performer_onesignal_id = db_connector.get_appuser_by_email(
                cursor, email=data.performers[0]
            )

            update_query = sql.SQL(
                """
                UPDATE game_card
                SET updatedby = %s, played_time = CURRENT_TIMESTAMP, performer = %s,
                title = CASE WHEN wildcard = TRUE THEN %s ELSE title END,
                description = CASE WHEN wildcard = TRUE THEN %s ELSE description END
                WHERE player = %s AND idgame_card = %s and game_card.deleted = FALSE
                """
            )
            cursor.execute(
                update_query,
                (
                    idappuser,
                    idperformer,
                    data.title,
                    data.description,
                    idappuser,
                    data.idgame_card,
                ),
            )
            connection.commit()
            if performer_onesignal_id:
                onesignal_helper.send_notification_to_users(
                    [performer_onesignal_id], f"{player_username} says you're up!"
                )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.put("/game/confirm-card/")
async def confirm_card(data: CardActionInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            idappuser, _ = db_connector.get_appuser(
                cursor, external_id=data.external_id
            )
            update_query = sql.SQL(
                """
                UPDATE game_card
                SET updatedby = %s, finished_time = CURRENT_TIMESTAMP
                WHERE player = %s AND idgame_card = %s AND game_card.deleted = FALSE
                """
            )
            cursor.execute(update_query, (idappuser, idappuser, data.idgame_card))
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.put("/game/skip-card/")
async def skip_card(data: CardActionInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            idappuser, _ = db_connector.get_appuser(
                cursor, external_id=data.external_id
            )
            query_skips = """
                SELECT skips_left
                FROM game_card
                LEFT JOIN game ON game.idgame = game_card.game
                LEFT JOIN game_appuser ON game.idgame = game_appuser.game
                AND game_appuser.appuser = %s
                WHERE game_card.deleted = FALSE AND idgame_card = %s
            """
            cursor.execute(query_skips, (idappuser, data.idgame_card))
            skips_data = cursor.fetchone()
            if skips_data[0] == 0:
                raise HTTPException(status_code=401, detail="No skips left")

            update_query = sql.SQL(
                """
                UPDATE game_card
                SET updatedby = %s, skipped = TRUE
                WHERE performer = %s AND idgame_card = %s AND game_card.deleted = FALSE
                """
            )
            cursor.execute(update_query, (idappuser, idappuser, data.idgame_card))

            update_query = sql.SQL(
                """
                UPDATE game_appuser SET skips_left = skips_left - 1
                WHERE appuser = %s AND skips_left > 0
                """
            )
            cursor.execute(update_query, (idappuser,))
            connection.commit()

    except psycopg2.Error as error:
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
