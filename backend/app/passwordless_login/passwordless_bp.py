import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from passwordless import (
    PasswordlessClient,
    PasswordlessClientBuilder,
    PasswordlessOptions,
)

load_dotenv()
app = FastAPI()


class PasswordlessApiConfig:
    def __init__(self, url: str, key: str, secret: str):
        self.url = url
        self.key = key
        self.secret = secret


class PasswordlessBlueprint:
    def __init__(self, app: FastAPI):
        self.app = app
        self.api_config = PasswordlessApiConfig(
            os.environ["PASSWORDLESS_API_URL"],
            os.environ["PASSWORDLESS_API_KEY"],
            os.environ["PASSWORDLESS_API_SECRET"],
        )


class PasswordlessApiBlueprint(PasswordlessBlueprint):
    def __init__(self, app: FastAPI):
        super().__init__(app)
        passwordless_options = PasswordlessOptions(
            self.api_config.secret, self.api_config.url
        )
        self.api_client = PasswordlessClientBuilder(passwordless_options).build()


# Create a FastAPI dependency to initialize the PasswordlessApiBlueprint
def get_passwordless_api(app: FastAPI = Depends()):
    return PasswordlessApiBlueprint(app)
