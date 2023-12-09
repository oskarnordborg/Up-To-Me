import psycopg2
from app import db_connector
from fastapi import APIRouter, HTTPException
from psycopg2 import sql
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()


class AppUserInput(BaseModel):
    userid: str
    username: str
    email: str
    firstname: str
    lastname: str
    onesignal_id: str = None


@router.get("/appusers/")
async def get_appusers():
    appusers: list = []
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT idappuser, email, firstname, lastname FROM appuser")
            appusers = cursor.fetchall()

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")
    return {
        "appusers": [
            {
                "idappuser": appuser[0],
                "email": appuser[1],
                "firstname": appuser[2],
                "lastname": appuser[3],
            }
            for appuser in appusers
        ]
    }


@router.get("/appuser/")
async def get_appuser(external_id: str):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_query = sql.SQL(
                "SELECT idappuser, username, email, firstname, lastname, onesignal_id "
                "FROM appuser WHERE external_id = %s LIMIT 1"
            )

            cursor.execute(get_query, (external_id,))
            appuser = cursor.fetchone()

            if not appuser:
                insert_query = sql.SQL(
                    "INSERT INTO appuser (external_id) VALUES (%s) "
                    "RETURNING idappuser, username, email, firstname, lastname, "
                    "onesignal_id"
                )
                cursor.execute(insert_query, (external_id,))
                connection.commit()
                appuser = cursor.fetchone()

            query = sql.SQL(
                """
                SELECT
                    (SELECT COUNT(*) FROM game_card WHERE player = %(user_id)s) AS total_cards_played,
                    (SELECT COUNT(*) FROM game_card WHERE performer = %(user_id)s AND finished_time IS NOT NULL) AS total_cards_finished,
                    (SELECT COUNT(*) FROM card WHERE appuser = %(user_id)s) AS total_cards_created,
                    (SELECT COUNT(*) FROM deck WHERE appuser = %(user_id)s) AS total_decks_created,
                    (SELECT COUNT(*) FROM game_appuser WHERE appuser = %(user_id)s) AS total_games_participated,
                    (SELECT AVG(num_cards) FROM (
                        SELECT COUNT(*) AS num_cards FROM game_card WHERE player = %(user_id)s GROUP BY game
                    ) AS card_counts) AS avg_cards_per_game
            """
            )

            cursor.execute(query, {"user_id": appuser[0]})
            user_stats = cursor.fetchone()

            keys = [
                "Total Cards Played",
                "Total Cards Finished",
                "Total Cards Created",
                "Total Decks Created",
                "Total Games Participated",
                "Avg Cards Per Game",
            ]

            stats_dict = {
                key: round(val, 2) if val else 0 for key, val in zip(keys, user_stats)
            }
            # stats_dict["First Card Created"] = str(user_stats[7])[:-10]

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return (
        {
            "idappuser": appuser[0],
            "username": appuser[1],
            "email": appuser[2],
            "firstname": appuser[3],
            "lastname": appuser[4],
            "onesignal_id": appuser[5],
            "statistics": stats_dict,
        }
        if appuser
        else {}
    )


@router.get("/appuser/search")
async def search_appuser(term: str, external_id: str):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_query = sql.SQL(
                """
                SELECT idappuser, username,
                EXISTS (
                    SELECT 1
                    FROM friendship
                    LEFT JOIN appuser au1 ON au1.idappuser = friendship.appuser1
                    LEFT JOIN appuser au2 ON au2.idappuser = friendship.appuser2
                    WHERE (au1.external_id = %s AND au2.username = appuser.username)
                    OR (au2.external_id = %s AND au1.username = appuser.username)
                )
                FROM appuser
                WHERE external_id != %s AND username ILIKE %s
            """
            )

            cursor.execute(
                get_query,
                (
                    external_id,
                    external_id,
                    external_id,
                    f"{term}%",
                ),
            )
            appusers = cursor.fetchall()

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {
        "appusers": [
            {
                "idappuser": appuser[0],
                "username": appuser[1],
                "friend": appuser[2],
            }
            for appuser in appusers
        ]
    }


@router.post("/appuser/")
async def create_appuser(data: AppUserInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_query = sql.SQL(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM appuser
                    WHERE username ILIKE %s AND external_id != %s
                )
            """
            )

            cursor.execute(get_query, (data.username, data.userid))
            exists = cursor.fetchone()[0]
            if exists:
                raise HTTPException(
                    status_code=400, detail="Username already registered"
                )

            insert_query = sql.SQL(
                "INSERT INTO appuser (external_id, username, email, firstname, lastname) VALUES ({})"
            ).format(
                sql.SQL(", ").join([sql.Placeholder()] * 5),
            )

            cursor.execute(
                insert_query,
                (data.userid, data.username, data.email, data.firstname, data.lastname),
            )
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.put("/appuser/")
async def update_appuser(data: AppUserInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_query = sql.SQL(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM appuser
                    WHERE username ILIKE %s AND external_id != %s
                )
            """
            )

            cursor.execute(get_query, (data.username, data.userid))
            exists = cursor.fetchone()[0]
            if exists:
                raise HTTPException(
                    status_code=400, detail="Username already registered"
                )
            update_query = sql.SQL(
                "UPDATE appuser SET username = %s, email = %s, firstname = %s, "
                "lastname = %s, onesignal_id = %s "
                "WHERE external_id = %s"
            )
            cursor.execute(
                update_query,
                (
                    data.username,
                    data.email,
                    data.firstname,
                    data.lastname,
                    data.onesignal_id,
                    data.userid,
                ),
            )
            connection.commit()

    except psycopg2.Error as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/appuser/")
async def delete_appuser(idappuser: int, external_id: str):
    try:
        db_connector.delete_object(
            table="appuser", idobject=idappuser, external_id=external_id
        )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
