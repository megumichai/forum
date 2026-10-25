from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..deps import AdminUser, SessionDep, get_current_admin
from ..models import Category, Post, Topic, User, UserRole
from ..models.base import utcnow
from ..schemas import (
    AdminCategoryCreate,
    AdminCategoryRead,
    AdminCategoryUpdate,
    AdminPostRead,
    AdminStats,
    AdminTopicUpdate,
    AdminUserRead,
    AnnouncementCreate,
    CategoryStats,
    Page,
    TopicSummary,
    UserRoleUpdate,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)

ANNOUNCEMENT_SLUG = "announcements"


def _reply_count(session: Session, topic_id: int) -> int:
    return (
        session.scalar(
            select(func.count(Post.id)).where(Post.topic_id == topic_id)
        )
        or 0
    )


def _topic_summary(session: Session, topic_id: int) -> TopicSummary:
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
    return TopicSummary.model_validate(topic).model_copy(
        update={"reply_count": _reply_count(session, topic.id)}
    )


def _admin_user_read(session: Session, user: User) -> AdminUserRead:
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
    return AdminUserRead.model_validate(user).model_copy(
        update={"topic_count": topic_count, "post_count": post_count}
    )


def _admin_category_read(
    session: Session, category: Category
) -> AdminCategoryRead:
    topic_count = (
        session.scalar(
            select(func.count(Topic.id)).where(
                Topic.category_id == category.id
            )
        )
        or 0
    )
    return AdminCategoryRead.model_validate(category).model_copy(
        update={"topic_count": topic_count}
    )


@router.get("/categories", response_model=list[AdminCategoryRead])
def list_categories(session: SessionDep):
    rows = session.execute(
        select(Category, func.count(Topic.id))
        .outerjoin(Topic, Topic.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.id)
    ).all()
    return [
        AdminCategoryRead.model_validate(category).model_copy(
            update={"topic_count": topic_count}
        )
        for category, topic_count in rows
    ]


@router.post(
    "/categories",
    response_model=AdminCategoryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: AdminCategoryCreate, session: SessionDep
) -> AdminCategoryRead:
    existing = session.scalar(
        select(Category).where(
            or_(
                Category.name == payload.name,
                Category.slug == payload.slug,
            )
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="分类名称或标识已存在",
        )

    category = Category(
        name=payload.name,
        slug=payload.slug,
        description=payload.description or None,
        min_role=payload.min_role,
    )
    session.add(category)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="分类名称或标识已存在",
        ) from None
    return _admin_category_read(session, category)


@router.patch(
    "/categories/{category_id}", response_model=AdminCategoryRead
)
def update_category(
    category_id: int,
    payload: AdminCategoryUpdate,
    session: SessionDep,
) -> AdminCategoryRead:
    category = session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    fields = payload.model_fields_set

    if "name" in fields and payload.name is not None:
        existing = session.scalar(
            select(Category).where(
                Category.name == payload.name,
                Category.id != category_id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="分类名称已存在",
            )
        category.name = payload.name

    if "slug" in fields and payload.slug is not None:
        existing = session.scalar(
            select(Category).where(
                Category.slug == payload.slug,
                Category.id != category_id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="分类标识已存在",
            )
        category.slug = payload.slug

    if "description" in fields:
        category.description = payload.description or None

    if "min_role" in fields:
        category.min_role = payload.min_role

    category.updated_at = utcnow()
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="分类名称或标识已存在",
        ) from None

    return _admin_category_read(session, category)


@router.get("/stats", response_model=AdminStats)
def get_stats(session: SessionDep) -> AdminStats:
    cutoff = utcnow() - timedelta(days=7)

    users = session.scalar(select(func.count(User.id))) or 0
    topics = session.scalar(select(func.count(Topic.id))) or 0
    posts = session.scalar(select(func.count(Post.id))) or 0
    views = (
        session.scalar(select(func.coalesce(func.sum(Topic.view_count), 0)))
        or 0
    )
    new_users = (
        session.scalar(
            select(func.count(User.id)).where(User.created_at >= cutoff)
        )
        or 0
    )
    new_topics = (
        session.scalar(
            select(func.count(Topic.id)).where(Topic.created_at >= cutoff)
        )
        or 0
    )
    new_posts = (
        session.scalar(
            select(func.count(Post.id)).where(Post.created_at >= cutoff)
        )
        or 0
    )

    category_rows = session.execute(
        select(
            Category.id,
            Category.name,
            Category.slug,
            func.count(Topic.id),
            func.coalesce(func.sum(Topic.view_count), 0),
        )
        .outerjoin(Topic, Topic.category_id == Category.id)
        .group_by(Category.id, Category.name, Category.slug)
        .order_by(Category.id)
    ).all()

    return AdminStats(
        users=users,
        topics=topics,
        posts=posts,
        views=views,
        new_users_7d=new_users,
        new_topics_7d=new_topics,
        new_posts_7d=new_posts,
        categories=[
            CategoryStats(
                id=category_id,
                name=name,
                slug=slug,
                topic_count=topic_count,
                view_count=view_count,
            )
            for category_id, name, slug, topic_count, view_count in category_rows
        ],
    )


@router.get("/users", response_model=Page[AdminUserRead])
def list_users(
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    role: UserRole | None = None,
):
    filters = []
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        filters.append(
            or_(
                User.username.ilike(pattern),
                User.display_name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )
    if role is not None:
        filters.append(User.role == role)

    total = (
        session.scalar(select(func.count(User.id)).where(*filters)) or 0
    )

    topic_count = (
        select(func.count(Topic.id))
        .where(Topic.author_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )
    post_count = (
        select(func.count(Post.id))
        .where(Post.author_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )

    rows = session.execute(
        select(
            User,
            topic_count.label("topic_count"),
            post_count.label("post_count"),
        )
        .where(*filters)
        .order_by(User.created_at.desc(), User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return Page(
        items=[
            AdminUserRead.model_validate(user).model_copy(
                update={
                    "topic_count": topic_total,
                    "post_count": post_total,
                }
            )
            for user, topic_total, post_total in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/users/{user_id}/role", response_model=AdminUserRead)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    session: SessionDep,
    admin: AdminUser,
) -> AdminUserRead:
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能修改自己的角色",
        )

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    user.updated_at = utcnow()
    session.commit()
    return _admin_user_read(session, user)


@router.get("/topics", response_model=Page[TopicSummary])
def list_topics(
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
):
    filters = []
    if search and search.strip():
        filters.append(Topic.title.ilike(f"%{search.strip()}%"))
    if category:
        filters.append(
            Topic.category_id.in_(
                select(Category.id).where(Category.slug == category)
            )
        )

    total = (
        session.scalar(select(func.count(Topic.id)).where(*filters)) or 0
    )

    rows = session.execute(
        select(Topic, func.count(Post.id))
        .outerjoin(Post, Post.topic_id == Topic.id)
        .options(selectinload(Topic.author), selectinload(Topic.category))
        .where(*filters)
        .group_by(Topic.id)
        .order_by(Topic.updated_at.desc(), Topic.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return Page(
        items=[
            TopicSummary.model_validate(topic).model_copy(
                update={"reply_count": reply_count}
            )
            for topic, reply_count in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/topics/{topic_id}", response_model=TopicSummary)
def update_topic(
    topic_id: int,
    payload: AdminTopicUpdate,
    session: SessionDep,
) -> TopicSummary:
    topic = session.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    if payload.category_id is not None:
        category = session.get(Category, payload.category_id)
        if category is None:
            raise HTTPException(status_code=404, detail="Category not found")
        topic.category = category
        topic.updated_at = utcnow()

    if payload.is_pinned is not None:
        topic.is_pinned = payload.is_pinned
    if payload.is_locked is not None:
        topic.is_locked = payload.is_locked

    session.commit()
    return _topic_summary(session, topic_id)


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(topic_id: int, session: SessionDep) -> None:
    topic = session.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    session.delete(topic)
    session.commit()


@router.get("/posts", response_model=Page[AdminPostRead])
def list_posts(
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
):
    filters = []
    if search and search.strip():
        filters.append(Post.content.ilike(f"%{search.strip()}%"))

    total = (
        session.scalar(select(func.count(Post.id)).where(*filters)) or 0
    )

    posts = session.scalars(
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.topic))
        .where(*filters)
        .order_by(Post.created_at.desc(), Post.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return Page(
        items=[AdminPostRead.model_validate(post) for post in posts],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, session: SessionDep) -> None:
    post = session.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    session.delete(post)
    session.commit()


@router.post(
    "/announcements",
    response_model=TopicSummary,
    status_code=status.HTTP_201_CREATED,
)
def create_announcement(
    payload: AnnouncementCreate,
    session: SessionDep,
    admin: AdminUser,
) -> TopicSummary:
    category = session.scalar(
        select(Category).where(Category.slug == ANNOUNCEMENT_SLUG)
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="公告分类不存在",
        )

    topic = Topic(
        category=category,
        author=admin,
        title=payload.title,
        content=payload.content,
        is_pinned=True,
    )
    session.add(topic)
    session.commit()
    return _topic_summary(session, topic.id)
