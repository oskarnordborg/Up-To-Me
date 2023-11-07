from fastapi import APIRouter, Body, HTTPException
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

from .passwordless_bp import PasswordlessApiBlueprint

fastapi_router = APIRouter()

# Create a PasswordlessApiBlueprint instance
api_bp = PasswordlessApiBlueprint("passwordless-api", __name__, "/passwordless")


@fastapi_router.post("/passwordless/login", response_model=VerifiedUserSchema)
async def login(request_data: VerifySignInSchema = Body(...)):
    try:
        response_data = api_bp.api_client.sign_in(request_data.dict())
        return response_data
    except PasswordlessError as e:
        raise HTTPException(status_code=400, detail=e.problem_details)


@fastapi_router.post("/passwordless/register", response_model=RegisteredTokenSchema)
async def register(request_data: RegisterTokenSchema = Body(...)):
    response_data = api_bp.api_client.register_token(request_data.dict())
    return response_data


@fastapi_router.post("/passwordless/alias", response_model=None)
async def set_alias(request_data: SetAliasSchema = Body(...)):
    api_bp.api_client.set_alias(request_data.dict())
    return None


@fastapi_router.get("/passwordless/alias/{user_id}", response_model=list[AliasSchema])
async def get_aliases(user_id: int):
    response_data = api_bp.api_client.get_aliases(user_id)
    return response_data


@fastapi_router.put("/passwordless/apps/feature", response_model=None)
async def set_apps_feature(request_data: UpdateAppsFeatureSchema = Body(...)):
    api_bp.api_client.update_apps_feature(request_data.dict())
    return None


@fastapi_router.get(
    "/passwordless/credentials/{user_id}", response_model=list[CredentialSchema]
)
async def get_credentials(user_id: int):
    response_data = api_bp.api_client.get_credentials(user_id)
    return response_data


@fastapi_router.delete("/passwordless/credentials", response_model=None)
async def delete_credentials(request_data: DeleteCredentialSchema = Body(...)):
    api_bp.api_client.delete_credential(request_data.dict())
    return None


@fastapi_router.get("/passwordless/users", response_model=list[UserSummarySchema])
async def get_users():
    response_data = api_bp.api_client.get_users()
    return response_data


@fastapi_router.delete("/passwordless/users", response_model=None)
async def delete_users(request_data: DeleteUserSchema = Body(...)):
    api_bp.api_client.delete_user(request_data.dict())
    return None
