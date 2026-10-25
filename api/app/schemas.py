from datetime import datetime
from typing import Annotated, Generic, TypeVar

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
)

from .models import UserRole

T = TypeVar("T")

Title = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]
Content = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=50000),
]


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


class UserPrivate(ORMModel):
    id: int
    username: str
    email: str
    display_name: str
    role: UserRole
    bio: str | None
    created_at: datetime


class RegisterRequest(BaseModel):
    username: str = Field(
        min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_]+$"
    )
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=64)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class TopicCreate(BaseModel):
    category_id: int
    title: Title
    content: Content


class TopicUpdate(BaseModel):
    title: Title | None = None
    content: Content | None = None
    category_id: int | None = None
    is_pinned: bool | None = None
    is_locked: bool | None = None


class PostCreate(BaseModel):
    content: Content


class PostUpdate(BaseModel):
    content: Content


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


class ViewCount(BaseModel):
    view_count: int


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
