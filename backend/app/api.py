import os

from app.passwordless_login import passwordless_api
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

from . import admin, appuser, card, deck, friendship, game
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
app.include_router(friendship.router)
app.include_router(game.router)
app.include_router(admin.router)
app.include_router(passwordless_api.router)

api_bp = PasswordlessApiBlueprint(app)


@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Testing root"}
