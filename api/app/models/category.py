from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .topic import Topic


class Category(BaseModel):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(64), unique=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    topics: Mapped[list["Topic"]] = relationship(
        back_populates="category", passive_deletes=True
    )
