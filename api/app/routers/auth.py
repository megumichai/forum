from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError

from ..config import settings
from ..deps import CurrentUser, SessionDep
from ..models import User, UserRole
from ..models.base import utcnow
from ..schemas import (
    LoginRequest,
    PasswordChangeRequest,
    ProfileUpdate,
    RegisterRequest,
    UserPrivate,
)
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


@router.patch("/me", response_model=UserPrivate)
def update_me(
    payload: ProfileUpdate, session: SessionDep, user: CurrentUser
) -> User:
    fields = payload.model_fields_set

    if "display_name" in fields and payload.display_name is not None:
        user.display_name = payload.display_name

    if "email" in fields and payload.email is not None:
        email = str(payload.email).lower()
        if email != user.email:
            existing = session.scalar(
                select(User).where(User.email == email, User.id != user.id)
            )
            if existing is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="邮箱已被使用",
                )
            user.email = email

    if "bio" in fields:
        user.bio = payload.bio or None

    if "avatar_url" in fields:
        avatar_url = payload.avatar_url or None
        if avatar_url is not None and not avatar_url.startswith(
            ("http://", "https://")
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="头像地址必须以 http:// 或 https:// 开头",
            )
        user.avatar_url = avatar_url

    user.updated_at = utcnow()
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="邮箱已被使用",
        ) from None

    return user


@router.patch("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChangeRequest, session: SessionDep, user: CurrentUser
) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码不正确",
        )

    if payload.new_password == payload.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码不能与当前密码相同",
        )

    user.password_hash = hash_password(payload.new_password)
    user.updated_at = utcnow()
    session.commit()
