from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..deps import SessionDep
from ..models import Post, Topic, User
from ..schemas import Page, TopicSummary, UserPostRead, UserRead

router = APIRouter(prefix="/users", tags=["users"])


def _get_user(session: Session, username: str) -> User:
    user = session.scalar(select(User).where(User.username == username))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{username}", response_model=UserRead)
def get_user(username: str, session: SessionDep):
    user = _get_user(session, username)

    topic_count = (
        session.scalar(
            select(func.count(Topic.id)).where(Topic.author_id == user.id)
        )
        or 0
    )
    post_count = (
        session.scalar(
            select(func.count(Post.id)).where(Post.author_id == user.id)
        )
        or 0
    )
    return UserRead.model_validate(user).model_copy(
        update={"topic_count": topic_count, "post_count": post_count}
    )


@router.get("/{username}/topics", response_model=Page[TopicSummary])
def list_user_topics(
    username: str,
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    user = _get_user(session, username)

    total = (
        session.scalar(
            select(func.count(Topic.id)).where(Topic.author_id == user.id)
        )
        or 0
    )
    statement = (
        select(Topic, func.count(Post.id))
        .outerjoin(Post, Post.topic_id == Topic.id)
        .options(selectinload(Topic.author), selectinload(Topic.category))
        .where(Topic.author_id == user.id)
        .group_by(Topic.id)
        .order_by(Topic.created_at.desc(), Topic.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = session.execute(statement).all()
    items = [
        TopicSummary.model_validate(topic).model_copy(
            update={"reply_count": reply_count}
        )
        for topic, reply_count in rows
    ]
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{username}/posts", response_model=Page[UserPostRead])
def list_user_posts(
    username: str,
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    user = _get_user(session, username)

    total = (
        session.scalar(
            select(func.count(Post.id)).where(Post.author_id == user.id)
        )
        or 0
    )
    posts = session.scalars(
        select(Post)
        .options(selectinload(Post.topic))
        .where(Post.author_id == user.id)
        .order_by(Post.created_at.desc(), Post.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return Page(
        items=[UserPostRead.model_validate(post) for post in posts],
        total=total,
        page=page,
        page_size=page_size,
    )
