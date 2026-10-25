from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import CurrentUser, SessionDep
from ..models import Post
from ..models.base import utcnow
from ..permissions import can_manage
from ..schemas import PostRead, PostUpdate

router = APIRouter(prefix="/posts", tags=["posts"])


def _get_post(session: Session, post_id: int) -> Post:
    post = session.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.patch("/{post_id}", response_model=PostRead)
def update_post(
    post_id: int,
    payload: PostUpdate,
    session: SessionDep,
    user: CurrentUser,
) -> Post:
    post = _get_post(session, post_id)
    if not can_manage(user, post.author_id):
        raise HTTPException(status_code=403, detail="Not allowed")

    post.content = payload.content
    post.updated_at = utcnow()
    session.commit()
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, session: SessionDep, user: CurrentUser) -> None:
    post = _get_post(session, post_id)
    if not can_manage(user, post.author_id):
        raise HTTPException(status_code=403, detail="Not allowed")

    session.delete(post)
    session.commit()
