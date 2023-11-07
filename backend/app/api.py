from fastapi import APIRouter, Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passwordless import (
    AliasSchema,
    CredentialSchema,
    DeleteCredentialSchema,
    DeleteUserSchema,
    PasswordlessError,
    RegisteredTokenSchema,
    RegisterTokenSchema,
    SetAliasSchema,
    UpdateAppsFeatureSchema,
    UserSummarySchema,
    VerifiedUserSchema,
    VerifySignInSchema,
)

from . import card
from .passwordless_login.passwordless_bp import PasswordlessApiBlueprint

app = FastAPI()

app.include_router(card.router)

api_bp = PasswordlessApiBlueprint(app)

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


@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Testing root"}


@app.post("/passwordless/login")
async def login(request_data):
    try:
        response_data = api_bp.api_client.sign_in(request_data.dict())
        return response_data
    except PasswordlessError as e:
        raise HTTPException(status_code=400, detail=e.problem_details)


@app.post("/passwordless/register")
async def register(request_data):
    response_data = api_bp.api_client.register_token(request_data.dict())
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
    print(response_data)
    return {"users": response_data}


@app.delete("/passwordless/users")
async def delete_users(request_data):
    api_bp.api_client.delete_user(request_data.dict())
    return None
