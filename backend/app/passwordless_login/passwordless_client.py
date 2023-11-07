import os

from dotenv import load_dotenv
from fastapi import Depends
from passwordless import (
    PasswordlessClient,
    PasswordlessClientBuilder,
    PasswordlessOptions,
)

load_dotenv()


class PasswordlessApiConfig:
    def __init__(self):
        self.url = os.environ["PASSWORDLESS_API_URL"]
        self.key = os.environ["PASSWORDLESS_API_KEY"]
        self.secret = os.environ["PASSWORDLESS_API_SECRET"]


class PasswordlessDependency:
    def __init__(self, api_config: PasswordlessApiConfig):
        self.api_client: PasswordlessClient = PasswordlessClientBuilder(
            PasswordlessOptions(api_config.secret, api_config.url)
        ).build()


api_config = PasswordlessApiConfig()


# Create a FastAPI dependency for your Passwordless functionality
def get_passwordless_client(
    api_config: PasswordlessApiConfig = Depends(PasswordlessDependency),
):
    return api_config.api_client
