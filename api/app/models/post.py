from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel
from .topic import Topic
from .user import User


class Post(BaseModel):
    __tablename__ = "posts"

    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(Text)

    topic: Mapped[Topic] = relationship(back_populates="posts")
    author: Mapped[User] = relationship(back_populates="posts")
