import psycopg2
from fastapi import HTTPException
from psycopg2 import sql
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    UniqueConstraint,
    create_engine,
    func,
)
from sqlalchemy.orm import sessionmaker

from . import DATABASE_URL, db_connection_params

engine = create_engine(DATABASE_URL, echo=True)

DbSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


metadata = MetaData()

db_appuser = Table(
    "appuser",
    metadata,
    Column("idappuser", Integer, primary_key=True),
    Column("createdtime", DateTime, server_default=func.now()),
    Column("updatedtime", DateTime, server_default=func.now(), onupdate=func.now()),
    Column("external_id", String(256)),
    Column("onesignal_id", String(256), nullable=True, default=None),
    Column("username", String(256), default=""),
    Column("email", String(256), default=""),
    Column("firstname", String(256), default=""),
    Column("lastname", String(256), default=""),
    Column("is_admin", Boolean, default=False),
    Column("deleted", Boolean, default=False),
)
db_friendship = Table(
    "friendship",
    metadata,
    Column("idfriendship", Integer, primary_key=True),
    Column("createdtime", DateTime, server_default=func.now()),
    Column("deleted", Boolean, default=False),
    Column("appuser1", Integer, ForeignKey("appuser.idappuser")),
    Column("appuser2", Integer, ForeignKey("appuser.idappuser")),
    Column("accepted", Boolean, default=False),
)
db_card = Table(
    "card",
    metadata,
    Column("idcard", Integer, primary_key=True),
    Column("createdtime", DateTime, server_default=func.now()),
    Column("createdby", Integer, ForeignKey("appuser.idappuser")),
    Column("updatedtime", DateTime, server_default=func.now(), onupdate=func.now()),
    Column("updatedby", Integer, ForeignKey("appuser.idappuser")),
    Column("appuser", Integer, ForeignKey("appuser.idappuser")),
    Column("title", String(256), default=""),
    Column("description", String(2048), default=""),
    Column("deleted", Boolean, default=False),
)
db_deck = Table(
    "deck",
    metadata,
    Column("iddeck", Integer, primary_key=True),
    Column("createdtime", DateTime, server_default=func.now()),
    Column("createdby", Integer, ForeignKey("appuser.idappuser")),
    Column("updatedtime", DateTime, server_default=func.now(), onupdate=func.now()),
    Column("updatedby", Integer, ForeignKey("appuser.idappuser")),
    Column("appuser", Integer, ForeignKey("appuser.idappuser")),
    Column("title", String(256), default=""),
    Column("description", String(2048), default=""),
    Column("deleted", Boolean, default=False),
)
db_card_deck = Table(
    "card_deck",
    metadata,
    Column("idcard_deck", Integer, primary_key=True),
    Column("createdtime", DateTime, server_default=func.now()),
    Column("createdby", Integer, ForeignKey("appuser.idappuser")),
    Column("updatedtime", DateTime, server_default=func.now(), onupdate=func.now()),
    Column("updatedby", Integer, ForeignKey("appuser.idappuser")),
    Column("appuser", Integer, ForeignKey("appuser.idappuser", ondelete="CASCADE")),
    Column("card", Integer, ForeignKey("card.idcard")),
    Column("deck", Integer, ForeignKey("deck.iddeck", ondelete="CASCADE")),
    Column("wildcard", Boolean, default=False),
    Column("deleted", Boolean, default=False),
    UniqueConstraint("card", "deck"),
)
db_game = Table(
    "game",
    metadata,
    Column("idgame", Integer, primary_key=True),
    Column("createdtime", DateTime, server_default=func.now()),
    Column("createdby", Integer, ForeignKey("appuser.idappuser")),
    Column("updatedtime", DateTime, server_default=func.now(), onupdate=func.now()),
    Column("updatedby", Integer, ForeignKey("appuser.idappuser")),
    Column("appuser", Integer, ForeignKey("appuser.idappuser", ondelete="CASCADE")),
    Column("deck", Integer, ForeignKey("deck.iddeck", ondelete="CASCADE")),
    Column("deleted", Boolean, default=False),
)
db_game_appuser = Table(
    "game_appuser",
    metadata,
    Column("idgame_appuser", Integer, primary_key=True),
    Column("createdtime", DateTime, server_default=func.now()),
    Column("createdby", Integer, ForeignKey("appuser.idappuser")),
    Column("updatedtime", DateTime, server_default=func.now(), onupdate=func.now()),
    Column("updatedby", Integer, ForeignKey("appuser.idappuser")),
    Column("appuser", Integer, ForeignKey("appuser.idappuser", ondelete="CASCADE")),
    Column("game", Integer, ForeignKey("game.idgame", ondelete="CASCADE")),
    Column("accepted", Boolean, default=False),
    Column("deleted", Boolean, default=False),
    UniqueConstraint("appuser", "game"),
)
db_game_card = Table(
    "game_card",
    metadata,
    Column("idgame_card", Integer, primary_key=True),
    Column("createdtime", DateTime, server_default=func.now()),
    Column("createdby", Integer, ForeignKey("appuser.idappuser")),
    Column("updatedtime", DateTime, server_default=func.now(), onupdate=func.now()),
    Column("updatedby", Integer, ForeignKey("appuser.idappuser")),
    Column("card", Integer, ForeignKey("card.idcard")),
    Column("game", Integer, ForeignKey("game.idgame", ondelete="CASCADE")),
    Column("player", Integer, ForeignKey("appuser.idappuser")),
    Column("performer", Integer, ForeignKey("appuser.idappuser", ondelete="CASCADE")),
    Column("wildcard", Boolean, default=False),
    Column("title", String(256), default=""),
    Column("description", String(2048), default=""),
    Column("played_time", DateTime),
    Column("finished_time", DateTime),
    Column("deleted", Boolean, default=False),
)


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
