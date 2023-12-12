import psycopg2
from app import db_connector
from app.db_connector import db_appuser, db_friendship
from fastapi import APIRouter, HTTPException
from psycopg2 import sql
from pydantic import BaseModel
from sqlalchemy import and_, join, or_, select
from sqlalchemy.orm import aliased
from sqlalchemy.sql import func, text

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
        with db_connector.DbSession() as session:
            query = select(
                db_appuser.c.idappuser,
                db_appuser.c.username,
                db_appuser.c.email,
                db_appuser.c.firstname,
                db_appuser.c.lastname,
                db_appuser.c.onesignal_id,
            )
            result = session.execute(query)
            appusers = result.fetchall()

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")
    return {
        "appusers": [
            {
                "idappuser": appuser[0],
                "username": appuser[1],
                "email": appuser[2],
                "firstname": appuser[3],
                "lastname": appuser[4],
                "onesignal_id": appuser[5],
            }
            for appuser in appusers
        ]
    }


@router.get("/appuser/")
async def get_appuser(external_id: str):
    try:
        with db_connector.DbSession() as session:
            query = (
                select(
                    db_appuser.c.idappuser,
                    db_appuser.c.username,
                    db_appuser.c.email,
                    db_appuser.c.firstname,
                    db_appuser.c.lastname,
                    db_appuser.c.onesignal_id,
                )
                .where(db_appuser.c.external_id == external_id)
                .limit(1)
            )

            result = session.execute(query)
            appuser = result.fetchone()

            if not appuser:
                ins_query = (
                    db_appuser.insert()
                    .values(external_id=external_id)
                    .returning(
                        db_appuser.c.idappuser,
                        db_appuser.c.username,
                        db_appuser.c.email,
                        db_appuser.c.firstname,
                        db_appuser.c.lastname,
                        db_appuser.c.onesignal_id,
                    )
                )

                result = session.execute(ins_query)
                appuser = result.fetchone()

            user_stats_query = text(
                """
                SELECT
                    (SELECT COUNT(*) FROM game_card WHERE player = :user_id) AS total_cards_played,
                    (SELECT COUNT(*) FROM game_card WHERE performer = :user_id AND finished_time IS NOT NULL) AS total_cards_finished,
                    (SELECT COUNT(*) FROM card WHERE appuser = :user_id) AS total_cards_created,
                    (SELECT COUNT(*) FROM deck WHERE appuser = :user_id) AS total_decks_created,
                    (SELECT COUNT(*) FROM game_appuser WHERE appuser = :user_id) AS total_games_participated,
                    (SELECT AVG(num_cards) FROM (
                        SELECT COUNT(*) AS num_cards FROM game_card WHERE player = :user_id GROUP BY game
                    ) AS card_counts) AS avg_cards_per_game
            """
            )

            user_stats = session.execute(user_stats_query, {"user_id": appuser[0]})
            user_stats_data = user_stats.fetchone()

            keys = [
                "Total Cards Played",
                "Total Cards Finished",
                "Total Cards Created",
                "Total Decks Created",
                "Total Games Participated",
                "Avg Cards Per Game",
            ]

            stats_dict = {
                key: round(val, 2) if val else 0
                for key, val in zip(keys, user_stats_data)
            }

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
            # stats_dict["First Card Created"] = str(user_stats[7])[:-10]

    except (Exception, psycopg2.Error) as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")


@router.get("/appuser/search")
async def search_appuser(term: str, external_id: str):
    try:
        with db_connector.DbSession() as session:
            au1 = aliased(db_appuser)
            au2 = aliased(db_appuser)
            subquery = (
                select(1)
                .select_from(
                    db_friendship.join(
                        au1, db_friendship.c.appuser1 == au1.c.idappuser
                    ).join(au2, db_friendship.c.appuser2 == au2.c.idappuser)
                )
                .where(
                    or_(
                        and_(
                            au1.c.external_id == external_id,
                            au2.c.username == db_appuser.c.username,
                        ),
                        and_(
                            au2.c.external_id == external_id,
                            au1.c.username == db_appuser.c.username,
                        ),
                    )
                )
                .exists()
            )

            query = select(
                db_appuser.c.idappuser,
                db_appuser.c.username,
                subquery.label("friend"),
            ).where(
                and_(
                    db_appuser.c.external_id != external_id,
                    db_appuser.c.username.ilike(f"{term}%"),
                )
            )

            result = session.execute(query)
            appusers = result.fetchall()

    except Exception as error:
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
        with db_connector.DbSession() as session:
            exists_query = select(db_appuser.c.idappuser).where(
                (db_appuser.c.username.ilike(data.username))
                & (db_appuser.c.external_id != data.userid)
            )
            user_exists = session.execute(exists_query).fetchone()

            if user_exists:
                raise HTTPException(
                    status_code=400, detail="Username already registered"
                )

            new_user = db_appuser.insert().values(
                external_id=data.userid,
                username=data.username,
                email=data.email,
                firstname=data.firstname,
                lastname=data.lastname,
            )
            session.execute(new_user)
            session.commit()

    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    return {"success": True}


@router.put("/appuser/")
async def update_appuser(data: AppUserInput):
    try:
        with db_connector.DbSession() as session:
            exists_query = select(db_appuser.c.idappuser).where(
                (db_appuser.c.username.ilike(data.username))
                & (db_appuser.c.external_id != data.userid)
            )
            user_exists = session.execute(exists_query).fetchone()

            if user_exists:
                raise HTTPException(
                    status_code=400, detail="Username already registered"
                )

            update_query = (
                db_appuser.update()
                .where(db_appuser.c.external_id == data.userid)
                .values(
                    username=data.username,
                    email=data.email,
                    firstname=data.firstname,
                    lastname=data.lastname,
                    onesignal_id=data.onesignal_id,
                )
            )
            session.execute(update_query)
            session.commit()

    except Exception as error:
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
