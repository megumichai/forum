from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from ..deps import SessionDep
from ..models import Category, Post, Topic
from ..schemas import Page, PostRead, TopicDetail, TopicSummary

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("", response_model=Page[TopicSummary])
def list_topics(
    session: SessionDep,
    category: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    filters = []
    if category is not None:
        filters.append(
            Topic.category_id.in_(
                select(Category.id).where(Category.slug == category)
            )
        )

    total = session.scalar(select(func.count(Topic.id)).where(*filters)) or 0

    statement = (
        select(Topic, func.count(Post.id))
        .outerjoin(Post, Post.topic_id == Topic.id)
        .options(selectinload(Topic.author), selectinload(Topic.category))
        .where(*filters)
        .group_by(Topic.id)
        .order_by(
            Topic.is_pinned.desc(), Topic.created_at.desc(), Topic.id.desc()
        )
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


@router.get("/{topic_id}", response_model=TopicDetail)
def get_topic(topic_id: int, session: SessionDep):
    topic = session.scalar(
        select(Topic)
        .options(
            selectinload(Topic.author),
            selectinload(Topic.category),
            selectinload(Topic.posts).selectinload(Post.author),
        )
        .where(Topic.id == topic_id)
    )
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.view_count += 1
    session.commit()
    return TopicDetail.model_validate(topic).model_copy(
        update={"reply_count": len(topic.posts)}
    )


@router.get("/{topic_id}/posts", response_model=Page[PostRead])
def list_topic_posts(
    topic_id: int,
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if session.get(Topic, topic_id) is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    total = (
        session.scalar(
            select(func.count(Post.id)).where(Post.topic_id == topic_id)
        )
        or 0
    )
    posts = session.scalars(
        select(Post)
        .options(selectinload(Post.author))
        .where(Post.topic_id == topic_id)
        .order_by(Post.created_at, Post.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return Page(items=list(posts), total=total, page=page, page_size=page_size)
