from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from ..deps import OptionalUser, SessionDep
from ..models import Category
from ..permissions import can_use_category
from ..schemas import CategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
def list_categories(
    session: SessionDep, user: OptionalUser, for_posting: bool = False
):
    categories = list(session.scalars(select(Category).order_by(Category.id)))
    if not for_posting:
        return categories
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return [
        category
        for category in categories
        if can_use_category(user, category.min_role)
    ]


@router.get("/{slug}", response_model=CategoryRead)
def get_category(slug: str, session: SessionDep):
    category = session.scalar(select(Category).where(Category.slug == slug))
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category
