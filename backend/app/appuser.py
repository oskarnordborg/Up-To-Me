import psycopg2
from app import db_connector
from fastapi import APIRouter, HTTPException
from psycopg2 import sql
from pydantic import BaseModel

from . import db_connection_params

router = APIRouter()


class CreateAppUserInput(BaseModel):
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
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")
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
                "SELECT idappuser, email, firstname, lastname FROM appuser WHERE external_id = %s LIMIT 1"
            )

            cursor.execute(get_query, (external_id,))
            appuser = cursor.fetchone()

    except (Exception, psycopg2.Error) as error:
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

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


@router.post("/appuser/")
async def create_appuser(data: CreateAppUserInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()

            insert_query = sql.SQL(
                "INSERT INTO appuser (email, firstname, lastname) VALUES ({})"
            ).format(
                sql.SQL(", ").join([sql.Placeholder()] * 3),
            )

            cursor.execute(insert_query, (data.email, data.firstname, data.lastname))
            connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.delete("/appuser/")
async def delete_appuser(idappuser: int):
    try:
        db_connector.delete_object(table="appuser", idobject=idappuser)

    except (Exception, psycopg2.Error) as error:
        print("Error connecting to PostgreSQL:", error)
        return HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}
