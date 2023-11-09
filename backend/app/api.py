import uuid

from app.helpers import jwt_helper
from fastapi import APIRouter, Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passwordless import (
    AliasSchema,
    CredentialSchema,
    DeleteCredentialSchema,
    DeleteUserSchema,
    PasswordlessError,
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
from pydantic import BaseModel

from . import appuser, card, deck
from .passwordless_login.passwordless_bp import PasswordlessApiBlueprint

app = FastAPI()
origins = [
    "https://up-to-me.onrender.com",
    "http://localhost:3000",
    "localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(card.router)
app.include_router(deck.router)
app.include_router(appuser.router)

api_bp = PasswordlessApiBlueprint(app)


class RegisterInput(BaseModel):
    username: str
    firstName: str
    lastName: str


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
        return {"jwt": jwt_helper.create_jwt(response_data)}
    except PasswordlessError as e:
        raise HTTPException(status_code=400, detail=e.problem_details)


@app.post("/passwordless/register")
async def register(request_data: RegisterInput):
    register_token = RegisterToken(
        user_id=str(uuid.uuid4()),
        username=request_data.username,
    )
    response_data = api_bp.api_client.register_token(register_token)
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
