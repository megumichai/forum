from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

from .models import UserRole

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AuthorRead(ORMModel):
    id: int
    username: str
    display_name: str
    role: UserRole


class UserRead(AuthorRead):
    bio: str | None
    created_at: datetime
    topic_count: int = 0
    post_count: int = 0


class CategoryRead(ORMModel):
    id: int
    name: str
    slug: str
    description: str | None


class PostRead(ORMModel):
    id: int
    content: str
    created_at: datetime
    updated_at: datetime
    author: AuthorRead


class TopicSummary(ORMModel):
    id: int
    title: str
    is_pinned: bool
    is_locked: bool
    view_count: int
    reply_count: int = 0
    created_at: datetime
    updated_at: datetime
    category: CategoryRead
    author: AuthorRead


class TopicDetail(TopicSummary):
    content: str
    posts: list[PostRead]


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
