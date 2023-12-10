import psycopg2
from app import db_connector
from app.helpers import onesignal_helper
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


class FriendshipUpdate(BaseModel):
    external_id: str
    username: str


@router.get("/friendships/")
async def get_friendships(external_id: str):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            user_pending_query = sql.SQL(
                """
                SELECT
                    au1.username
                FROM friendship f
                INNER JOIN appuser au1 ON f.appuser1 = au1.idappuser
                INNER JOIN appuser au2 ON f.appuser2 = au2.idappuser
                WHERE au2.external_id = %s AND f.accepted = FALSE
                """
            )

            cursor.execute(user_pending_query, (external_id,))
            pending_requests = cursor.fetchall() or []
            pending = [
                {"username": pending_request[0]} for pending_request in pending_requests
            ]

            get_friends_query = sql.SQL(
                """
                SELECT
                    f.accepted,
                    CASE
                        WHEN f.appuser1 = au.idappuser THEN au2.username
                        ELSE au1.username
                    END AS friend_username
                FROM friendship f
                INNER JOIN
                    appuser au ON f.appuser1 = au.idappuser OR f.appuser2 = au.idappuser
                LEFT JOIN appuser au1 ON f.appuser1 = au1.idappuser
                LEFT JOIN appuser au2 ON f.appuser2 = au2.idappuser
                WHERE au.external_id = %s AND (
                    au2.external_id != %s OR f.accepted = TRUE
                )
                """
            )
            cursor.execute(get_friends_query, (external_id, external_id))
            friendships = cursor.fetchall() or []
            friends = [
                {"accepted": friendship[0], "username": friendship[1]}
                for friendship in friendships
            ]

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"pending": pending, "friends": friends}


@router.get("/friends/")
async def get_friends(external_id: str):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_friends_query = sql.SQL(
                """
                SELECT
                    CASE
                        WHEN f.appuser1 = au.idappuser THEN au2.username
                        ELSE au1.username
                    END AS friend_username,
                    CASE
                        WHEN f.appuser1 = au.idappuser THEN au2.idappuser
                        ELSE au1.idappuser
                    END AS friend_idappuser
                FROM friendship f
                INNER JOIN
                    appuser au ON f.appuser1 = au.idappuser OR f.appuser2 = au.idappuser
                LEFT JOIN appuser au1 ON f.appuser1 = au1.idappuser
                LEFT JOIN appuser au2 ON f.appuser2 = au2.idappuser
                WHERE au.external_id = %s AND f.accepted = TRUE
                """
            )
            cursor.execute(get_friends_query, (external_id,))
            friendships = cursor.fetchall() or []
            friends = [
                {"username": friendship[0], "idappuser": friendship[1]}
                for friendship in friendships
            ]

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"friends": friends}


@router.post("/friendship/create", response_model=None)
async def create_friendship(friendship_data: FriendshipUpdate):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_appuser1_query = sql.SQL(
                """
                SELECT idappuser, username
                FROM appuser
                WHERE external_id = %s
            """
            )
            cursor.execute(get_appuser1_query, (friendship_data.external_id,))
            appuser1 = cursor.fetchone()
            if not appuser1:
                raise HTTPException(
                    status_code=404, detail="AppUser with this external_id not found"
                )

            get_appuser2_query = sql.SQL(
                """
                SELECT idappuser, onesignal_id
                FROM appuser
                WHERE username ILIKE %s
            """
            )
            cursor.execute(get_appuser2_query, (friendship_data.username,))
            appuser2 = cursor.fetchone()
            if not appuser2:
                raise HTTPException(
                    status_code=404, detail="AppUser with this username not found"
                )

            insert_friendship_query = sql.SQL(
                """
                INSERT INTO friendship (appuser1, appuser2)
                VALUES (%s, %s)
            """
            )
            cursor.execute(insert_friendship_query, (appuser1[0], appuser2[0]))
            connection.commit()

            onesignal_helper.send_notification_to_users(
                [appuser2[1]], f"{appuser1[1]} wants to be friends!"
            )
    except psycopg2.Error as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"message": "Friendship created successfully"}


@router.put("/friendship/accept", response_model=None)
async def accept_friendship(friendship_data: FriendshipUpdate):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            get_appuser1_query = """
                SELECT idappuser
                FROM appuser
                WHERE external_id = %s
            """
            cursor.execute(get_appuser1_query, (friendship_data.external_id,))
            appuser1 = cursor.fetchone()
            if not appuser1:
                raise HTTPException(
                    status_code=404, detail="AppUser with this external_id not found"
                )

            get_appuser2_query = """
                SELECT idappuser
                FROM appuser
                WHERE username ILIKE %s
            """
            cursor.execute(get_appuser2_query, (friendship_data.username,))
            appuser2 = cursor.fetchone()
            if not appuser2:
                raise HTTPException(
                    status_code=404, detail="AppUser with this username not found"
                )

            accept_friendship_query = """
                UPDATE friendship SET accepted = TRUE
                WHERE appuser2 = %s AND appuser1 = %s
            """
            cursor.execute(accept_friendship_query, (appuser1[0], appuser2[0]))
            connection.commit()

    except psycopg2.Error as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"message": "Friendship accepted successfully"}


@router.delete("/friendship/")
async def delete_friendship(friendship_data: FriendshipUpdate):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_appuser_query = """
                SELECT idappuser
                FROM appuser
                WHERE username ILIKE %s
            """
            cursor.execute(get_appuser_query, (friendship_data.username,))
            appuser2 = cursor.fetchone()
            if not appuser2:
                raise HTTPException(
                    status_code=404, detail="AppUser with this username not found"
                )

        db_connector.delete_object(
            table="friendship",
            idobject=appuser2[0],
            external_id=friendship_data.external_id,
        )

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
