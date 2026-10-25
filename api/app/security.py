from datetime import UTC, datetime, timedelta

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from .config import settings

_password_hash = PasswordHash.recommended()
_algorithm = "HS256"


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(UTC) + timedelta(seconds=settings.session_max_age)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        settings.secret_key,
        algorithm=_algorithm,
    )


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[_algorithm]
        )
        return int(payload["sub"])
    except (InvalidTokenError, KeyError, TypeError, ValueError):
        return None


def hash_password(password: str):
    return _password_hash.hash(password)


def verify_password(password: str, hashed_password: str):
    return _password_hash.verify(password, hashed_password)
