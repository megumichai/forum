from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError

from ..config import settings
from ..deps import CurrentUser, SessionDep
from ..models import User, UserRole
from ..schemas import LoginRequest, RegisterRequest, UserPrivate
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, user: User) -> None:
    response.set_cookie(
        key=settings.session_cookie,
        value=create_access_token(user.id),
        max_age=settings.session_max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post(
    "/register", response_model=UserPrivate, status_code=status.HTTP_201_CREATED
)
def register(
    payload: RegisterRequest, response: Response, session: SessionDep
) -> User:
    username = payload.username.strip()
    email = str(payload.email).lower()

    existing = session.scalar(
        select(User).where(
            or_(User.username == username, User.email == email)
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用户名或邮箱已被使用",
        )

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name or username,
        role=UserRole.USER,
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用户名或邮箱已被使用",
        ) from None

    _set_session_cookie(response, user)
    return user


@router.post("/login", response_model=UserPrivate)
def login(
    payload: LoginRequest, response: Response, session: SessionDep
) -> User:
    identifier = payload.identifier.strip()
    user = session.scalar(
        select(User).where(
            or_(
                User.username == identifier,
                User.email == identifier.lower(),
            )
        )
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    _set_session_cookie(response, user)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(
        settings.session_cookie,
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )


@router.get("/me", response_model=UserPrivate)
def me(user: CurrentUser) -> User:
    return user
