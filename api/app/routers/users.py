from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from ..deps import SessionDep
from ..models import Post, Topic, User
from ..schemas import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{username}", response_model=UserRead)
def get_user(username: str, session: SessionDep):
    user = session.scalar(select(User).where(User.username == username))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

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
