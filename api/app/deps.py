from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .config import settings
from .db import get_session
from .models import User, UserRole
from .security import decode_access_token

SessionDep = Annotated[Session, Depends(get_session)]


def _user_from_request(request: Request, session: Session) -> User | None:
    token = request.cookies.get(settings.session_cookie)
    user_id = decode_access_token(token) if token else None
    return session.get(User, user_id) if user_id is not None else None


def get_current_user(request: Request, session: SessionDep) -> User:
    user = _user_from_request(request, session)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


def get_optional_user(request: Request, session: SessionDep) -> User | None:
    return _user_from_request(request, session)


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


def get_current_admin(user: CurrentUser) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


AdminUser = Annotated[User, Depends(get_current_admin)]
