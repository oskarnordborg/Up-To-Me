import json
import os

import jwt


def create_jwt(payload, roles=["User"]):
    payload_dict = payload.__dict__
    payload_dict["timestamp"] = payload_dict["timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ")
    payload_dict["expires_at"] = payload_dict["expires_at"].strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    payload_dict["roles"] = roles
    return jwt.encode(payload_dict, os.environ["JWT_SECRET_KEY"], algorithm="HS256")
