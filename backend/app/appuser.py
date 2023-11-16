import psycopg2
from app import db_connector
from fastapi import APIRouter, HTTPException
from psycopg2 import sql
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()


class AppUserInput(BaseModel):
    userid: str
    email: str
    firstname: str
    lastname: str


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
                "SELECT idappuser, email, firstname, lastname "
                "FROM appuser WHERE external_id = %s LIMIT 1"
            )

            cursor.execute(get_query, (external_id,))
            appuser = cursor.fetchone()

            if not appuser:
                insert_query = sql.SQL(
                    "INSERT INTO appuser (external_id) VALUES (%s) "
                    "RETURNING idappuser, email, firstname, lastname"
                )
                cursor.execute(insert_query, (external_id,))
                connection.commit()
                appuser = cursor.fetchone()

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return (
        {
            "idappuser": appuser[0],
            "email": appuser[1],
            "firstname": appuser[2],
            "lastname": appuser[3],
        }
        if appuser
        else {}
    )


@router.get("/appuser/search")
async def search_appuser(term: str):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                "SELECT idappuser, email FROM appuser WHERE email ILIKE {}"
            ).format(sql.Literal(f"{term}%"))

            cursor.execute(get_query)
            appusers = cursor.fetchall()

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {
        "appusers": [
            {
                "idappuser": appuser[0],
                "email": appuser[1],
            }
            for appuser in appusers
        ]
    }


@router.post("/appuser/")
async def create_appuser(data: AppUserInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            insert_query = sql.SQL(
                "INSERT INTO appuser (external_id, email, firstname, lastname) VALUES ({})"
            ).format(
                sql.SQL(", ").join([sql.Placeholder()] * 4),
            )

            cursor.execute(
                insert_query, (data.userid, data.email, data.firstname, data.lastname)
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

            update_query = sql.SQL(
                "UPDATE appuser SET email = %s, firstname = %s, lastname = %s "
                "WHERE external_id = %s"
            )
            cursor.execute(
                update_query, (data.email, data.firstname, data.lastname, data.userid)
            )
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/appuser/")
async def delete_appuser(idappuser: int):
    try:
        db_connector.delete_object(table="appuser", idobject=idappuser)

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
