import psycopg2
from fastapi import HTTPException
from psycopg2 import sql

from . import db_connection_params


def delete_object(table: str, idobject: int, external_id: int):
    with psycopg2.connect(**db_connection_params) as connection:
        cursor = connection.cursor()

        get_query = sql.SQL(
            "SELECT idappuser FROM appuser WHERE deleted = FALSE AND external_id = %s LIMIT 1"
        )
        cursor.execute(get_query, (external_id,))
        appuser = cursor.fetchone()

        if not appuser:
            raise HTTPException(status_code=422, detail="User not found")

        idappuser = appuser[0]

        delete_query = sql.SQL(
            f"UPDATE {table} SET deleted = TRUE, updatedby = %s WHERE id{table} = %s"
        )

        cursor.execute(delete_query, (idappuser, idobject))
        connection.commit()


def get_appuser(cursor, external_id: str):
    get_query = sql.SQL(
        "SELECT idappuser, username FROM appuser "
        "WHERE deleted = FALSE AND external_id = %s LIMIT 1"
    )
    cursor.execute(get_query, (external_id,))
    appuser = cursor.fetchone()

    if not appuser:
        raise HTTPException(status_code=422, detail="User not found")

    return appuser[0], appuser[1]


def get_appuser_by_email(cursor, email: str):
    get_query = sql.SQL(
        "SELECT idappuser, onesignal_id "
        "FROM appuser WHERE deleted = FALSE AND username = %s LIMIT 1"
    )
    cursor.execute(get_query, (email,))
    appuser = cursor.fetchone()

    if not appuser:
        raise HTTPException(status_code=422, detail="User not found")

    return appuser[0], appuser[1]


def get_appuser_by_username(cursor, username: str):
    get_query = sql.SQL(
        "SELECT idappuser, onesignal_id "
        "FROM appuser WHERE deleted = FALSE AND username = %s LIMIT 1"
    )
    cursor.execute(get_query, (username,))
    appuser = cursor.fetchone()

    if not appuser:
        raise HTTPException(status_code=422, detail="User not found")

    return appuser[0], appuser[1]
