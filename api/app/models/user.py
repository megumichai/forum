from enum import StrEnum

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class UserRole(StrEnum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"


class User(BaseModel):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(64))
    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            values_callable=lambda enum: [item.value for item in enum],
            name="user_role",
        ),
        default=UserRole.USER,
        server_default=UserRole.USER.value,
        nullable=False,
    )
    bio: Mapped[str | None] = mapped_column(Text)
