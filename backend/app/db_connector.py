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
