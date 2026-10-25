from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel
from .category import Category
from .user import User

if TYPE_CHECKING:
    from .post import Post


class Topic(BaseModel):
    __tablename__ = "topics"

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    view_count: Mapped[int] = mapped_column(default=0, nullable=False)

    category: Mapped[Category] = relationship(back_populates="topics")
    author: Mapped[User] = relationship(back_populates="topics")
    posts: Mapped[list["Post"]] = relationship(
        back_populates="topic",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Post.created_at",
    )
