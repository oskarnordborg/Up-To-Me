import os
import uuid

import psycopg2
from app import db_connector
from app.helpers import jwt_helper
from fastapi import APIRouter, Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from passwordless import (
    AliasSchema,
    CredentialSchema,
    DeleteCredentialSchema,
    DeleteUserSchema,
    PasswordlessError,
    RegisteredToken,
    RegisteredTokenSchema,
    RegisterToken,
    RegisterTokenSchema,
    SetAliasSchema,
    UpdateAppsFeatureSchema,
    UserSummarySchema,
    VerifiedUser,
    VerifiedUserSchema,
    VerifySignIn,
    VerifySignInSchema,
)
from psycopg2 import sql
from pydantic import BaseModel
from starlette.requests import Request

from . import admin, appuser, card, db_connection_params, deck, game
from .passwordless_login.passwordless_bp import PasswordlessApiBlueprint

app = FastAPI()
origins = [
    "https://up-to-me.onrender.com",
    "http://localhost:3000",
    "localhost:3000",
]


async def api_key_validation(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    api_key = request.headers.get("x-api-key", None)
    if not api_key or api_key != os.environ["X_API_KEY"]:
        raise HTTPException(status_code=401, detail="Invalid API key")

    response = await call_next(request)
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["x-api-key"],
)
app.middleware("http")(api_key_validation)

app.include_router(card.router)
app.include_router(deck.router)
app.include_router(appuser.router)
app.include_router(game.router)
app.include_router(admin.router)

api_bp = PasswordlessApiBlueprint(app)


class RegisterInput(BaseModel):
    email: str
    firstName: str
    lastName: str


class RegisteredTokenUserId(RegisteredToken):
    userid: str


class LoginInput(BaseModel):
    token: str


@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Testing root"}


@app.post("/passwordless/login")
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


@app.post("/passwordless/register")
async def register(request_data: RegisterInput):
    new_user_id = str(uuid.uuid4())
    register_token = RegisterToken(
        user_id=new_user_id,
        username=request_data.email,
    )
    response_data: RegisteredTokenUserId = api_bp.api_client.register_token(
        register_token
    )
    if response_data:
        return {"token": response_data.token, "userid": new_user_id}
    return response_data


@app.post("/passwordless/alias")
async def set_alias(request_data):
    api_bp.api_client.set_alias(request_data.dict())
    return None


@app.get("/passwordless/alias/{user_id}")
async def get_aliases(user_id: int):
    response_data = api_bp.api_client.get_aliases(user_id)
    return response_data


@app.put("/passwordless/apps/feature")
async def set_apps_feature(request_data):
    api_bp.api_client.update_apps_feature(request_data.dict())
    return None


@app.get("/passwordless/credentials/{user_id}")
async def get_credentials(user_id: int):
    response_data = api_bp.api_client.get_credentials(user_id)
    return response_data


@app.delete("/passwordless/credentials")
async def delete_credentials(request_data):
    api_bp.api_client.delete_credential(request_data.dict())
    return None


@app.get("/passwordless/users")
async def get_users():
    response_data = api_bp.api_client.get_users()
    return {"users": response_data}


@app.delete("/passwordless/users")
async def delete_users(request_data):
    api_bp.api_client.delete_user(request_data.dict())
    return None
