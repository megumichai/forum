from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from ..deps import SessionDep
from ..models import Category
from ..schemas import CategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
def list_categories(session: SessionDep):
    return list(session.scalars(select(Category).order_by(Category.id)))


@router.get("/{slug}", response_model=CategoryRead)
def get_category(slug: str, session: SessionDep):
    category = session.scalar(select(Category).where(Category.slug == slug))
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category
