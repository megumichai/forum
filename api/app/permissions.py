from .models import User, UserRole


def is_staff(user: User) -> bool:
    return user.role in (UserRole.MODERATOR, UserRole.ADMIN)


def can_manage(user: User, author_id: int) -> bool:
    return user.id == author_id or is_staff(user)
