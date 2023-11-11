import psycopg2
from app import db_connector
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


@router.get("/games/")
async def get_appuser(external_id: str):
    games = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT email FROM appuser WHERE external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (external_id,))
            appuser_email = cursor.fetchone()[0]
            print(appuser_email)
            cursor.execute(
                """
                SELECT g.idgame, g.createdtime, a.email, d.title
                FROM game AS g
                INNER JOIN game_appuser AS ga ON g.idgame = ga.game
                INNER JOIN appuser AS a ON ga.appuser = a.idappuser
                INNER JOIN deck AS d ON g.deck = d.iddeck
                WHERE a.external_id = %s
                """,
                (external_id,),
            )
            games_data = cursor.fetchall()

            for game_data in games_data:
                game = {
                    "idgame": game_data[0],
                    "createdtime": game_data[1],
                    "appuser": game_data[2],
                    "deck": game_data[3],
                }

                cursor.execute(
                    """
                    SELECT a.email
                    FROM appuser AS a
                    INNER JOIN game_appuser AS ga ON a.idappuser = ga.appuser
                    WHERE ga.game = %s
                    """,
                    (game_data[0],),
                )
                game_appusers_data = cursor.fetchall()

                game["participants"] = [
                    email[0]
                    for email in game_appusers_data
                    if email[0] != appuser_email
                ]

                games.append(game)

    except (Exception, psycopg2.Error) as error:
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"games": games}


@router.post("/game/")
async def create_appuser(data: CreateGameInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT idappuser FROM appuser WHERE external_id = %s LIMIT 1"
            )
            cursor.execute(get_query, (data.external_id,))
            idappuser = cursor.fetchone()[0]
            print("idappuser", idappuser)
            data.participants.append(idappuser)

            insert_query = sql.SQL(
                ("INSERT INTO game (appuser, deck) VALUES (%s, %s) RETURNING idgame")
            )
            cursor.execute(insert_query, (idappuser, data.deck))
            connection.commit()
            idgame = cursor.fetchone()
            print("idgame", idgame)
            insert_game_appuser_query = """
                INSERT INTO game_appuser (game, appuser)
                VALUES %s
            """
            execute_values(
                cursor,
                insert_game_appuser_query,
                [(idgame, participant) for participant in data.participants],
            )

            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/game/")
async def delete_game(idgame: int):
    try:
        db_connector.delete_object(table="game", idobject=idgame)

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
