import psycopg2
from psycopg2 import sql

from . import db_connection_params


def delete_object(table: str, idobject: int, idappuser: int):
    with psycopg2.connect(**db_connection_params) as connection:
        cursor = connection.cursor()

        delete_query = sql.SQL(
            f"UPDATE {table} SET deleted = TRUE WHERE id{table} = %s"
        )

        cursor.execute(delete_query, (idobject,))
        connection.commit()
