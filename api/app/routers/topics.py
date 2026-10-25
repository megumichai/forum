from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..deps import CurrentUser, SessionDep
from ..models import Category, Post, Topic
from ..models.base import utcnow
from ..permissions import can_manage, can_use_category, is_staff
from ..schemas import (
    Page,
    PostCreate,
    PostRead,
    TopicCreate,
    TopicDetail,
    TopicSummary,
    TopicUpdate,
    ViewCount,
)

router = APIRouter(prefix="/topics", tags=["topics"])


def _get_topic(session: Session, topic_id: int) -> Topic:
    topic = session.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


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
        )
        .where(Topic.id == topic_id)
    )
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    reply_count = (
        session.scalar(
            select(func.count(Post.id)).where(Post.topic_id == topic.id)
        )
        or 0
    )
    return TopicDetail.model_validate(topic).model_copy(
        update={"reply_count": reply_count}
    )


@router.post("/{topic_id}/view", response_model=ViewCount)
def count_view(topic_id: int, session: SessionDep) -> ViewCount:
    topic = _get_topic(session, topic_id)
    topic.view_count += 1
    session.commit()
    return ViewCount(view_count=topic.view_count)


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


@router.post(
    "", response_model=TopicSummary, status_code=status.HTTP_201_CREATED
)
def create_topic(
    payload: TopicCreate, session: SessionDep, user: CurrentUser
) -> Topic:
    category = session.get(Category, payload.category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    if not can_use_category(user, category.min_role):
        raise HTTPException(
            status_code=403, detail="无权在该分类发布话题"
        )

    topic = Topic(
        category=category,
        author=user,
        title=payload.title,
        content=payload.content,
    )
    session.add(topic)
    session.commit()
    return topic


@router.patch("/{topic_id}", response_model=TopicSummary)
def update_topic(
    topic_id: int,
    payload: TopicUpdate,
    session: SessionDep,
    user: CurrentUser,
) -> TopicSummary:
    topic = _get_topic(session, topic_id)
    if not can_manage(user, topic.author_id):
        raise HTTPException(status_code=403, detail="Not allowed")

    manages_flags = payload.is_pinned is not None or payload.is_locked is not None
    if manages_flags and not is_staff(user):
        raise HTTPException(status_code=403, detail="Not allowed")

    if payload.title is not None:
        topic.title = payload.title
    if payload.content is not None:
        topic.content = payload.content
    if payload.category_id is not None:
        category = session.get(Category, payload.category_id)
        if category is None:
            raise HTTPException(status_code=404, detail="Category not found")
        if not can_use_category(user, category.min_role):
            raise HTTPException(
                status_code=403, detail="无权使用该分类"
            )
        topic.category = category
    if payload.is_pinned is not None:
        topic.is_pinned = payload.is_pinned
    if payload.is_locked is not None:
        topic.is_locked = payload.is_locked

    content_changed = (
        payload.title is not None
        or payload.content is not None
        or payload.category_id is not None
    )
    if content_changed:
        topic.updated_at = utcnow()

    session.commit()

    reply_count = (
        session.scalar(
            select(func.count(Post.id)).where(Post.topic_id == topic.id)
        )
        or 0
    )
    return TopicSummary.model_validate(topic).model_copy(
        update={"reply_count": reply_count}
    )


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    topic_id: int, session: SessionDep, user: CurrentUser
) -> None:
    topic = _get_topic(session, topic_id)
    if not can_manage(user, topic.author_id):
        raise HTTPException(status_code=403, detail="Not allowed")

    session.delete(topic)
    session.commit()


@router.post(
    "/{topic_id}/posts",
    response_model=PostRead,
    status_code=status.HTTP_201_CREATED,
)
def create_reply(
    topic_id: int,
    payload: PostCreate,
    session: SessionDep,
    user: CurrentUser,
) -> Post:
    topic = _get_topic(session, topic_id)
    if topic.is_locked and not is_staff(user):
        raise HTTPException(status_code=409, detail="Topic is locked")

    post = Post(topic=topic, author=user, content=payload.content)
    session.add(post)
    topic.updated_at = utcnow()
    session.commit()
    return post
