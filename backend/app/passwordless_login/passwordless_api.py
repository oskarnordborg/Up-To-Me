import uuid
from datetime import datetime, timedelta

import psycopg2
from app import db_connection_params
from app.helpers import jwt_helper
from fastapi import APIRouter, FastAPI, HTTPException
from passwordless import (
    PasswordlessError,
    RegisteredToken,
    RegisterToken,
    VerifiedUser,
    VerifySignIn,
)
from psycopg2 import sql
from pydantic import BaseModel

from .passwordless_bp import PasswordlessApiBlueprint

app = FastAPI()
router = APIRouter()

api_bp = PasswordlessApiBlueprint(app)


class RegisterInput(BaseModel):
    username: str
    email: str
    firstName: str
    lastName: str


class RegisteredTokenUserId(RegisteredToken):
    userid: str


@router.post("/passwordless/login")
async def login(token: str):
    try:
        verify_sign_in = VerifySignIn(token)
        response_data: VerifiedUser = api_bp.api_client.sign_in(verify_sign_in)
        roles = ["User"]
        try:
            with psycopg2.connect(**db_connection_params) as connection:
                cursor = connection.cursor()
                get_query = sql.SQL(
                    "SELECT is_admin FROM appuser WHERE external_id = %s LIMIT 1"
                )

                cursor.execute(get_query, (response_data.user_id,))
                appuser = cursor.fetchone()

                if appuser[0] is True:
                    roles.append("Admin")

        except (Exception, psycopg2.Error) as error:
            raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

        return {"jwt": jwt_helper.create_jwt(payload=response_data, roles=roles)}
    except PasswordlessError as e:
        raise HTTPException(status_code=400, detail=e.problem_details)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/passwordless/register")
async def register(request_data: RegisterInput):
    try:
        with psycopg2.connect(**db_connection_params) as connection:
            cursor = connection.cursor()
            get_query = sql.SQL(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM appuser
                    WHERE username ILIKE %s
                )
            """
            )

            cursor.execute(get_query, (request_data.username,))
            exists = cursor.fetchone()[0]
            if exists:
                raise HTTPException(
                    status_code=400, detail="Username already registered"
                )

    except (Exception, psycopg2.Error) as error:
        print(str(error))
        raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")

    new_user_id = str(uuid.uuid4())
    register_token = RegisterToken(
        user_id=new_user_id,
        username=request_data.email,
        expires_at=datetime.utcnow() + timedelta(minutes=2),
    )
    response_data: RegisteredTokenUserId = api_bp.api_client.register_token(
        register_token
    )
    if response_data:
        return {"token": response_data.token, "userid": new_user_id}
    return response_data


@router.post("/passwordless/alias")
async def set_alias(request_data):
    api_bp.api_client.set_alias(request_data.dict())
    return None


@router.get("/passwordless/alias/{user_id}")
async def get_aliases(user_id: int):
    response_data = api_bp.api_client.get_aliases(user_id)
    return response_data


@router.put("/passwordless/apps/feature")
async def set_apps_feature(request_data):
    api_bp.api_client.update_apps_feature(request_data.dict())
    return None


@router.get("/passwordless/credentials/{user_id}")
async def get_credentials(user_id: int):
    response_data = api_bp.api_client.get_credentials(user_id)
    return response_data


@router.delete("/passwordless/credentials")
async def delete_credentials(request_data):
    api_bp.api_client.delete_credential(request_data.dict())
    return None


@router.get("/passwordless/users")
async def get_users():
    response_data = api_bp.api_client.get_users()
    return {"users": response_data}


@router.delete("/passwordless/users")
async def delete_users(request_data):
    api_bp.api_client.delete_user(request_data.dict())
    return None
