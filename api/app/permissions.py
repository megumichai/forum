from .models import User, UserRole

ROLE_RANK = {
    UserRole.USER: 0,
    UserRole.MODERATOR: 1,
    UserRole.ADMIN: 2,
}


def is_staff(user: User) -> bool:
    return user.role in (UserRole.MODERATOR, UserRole.ADMIN)


def can_manage(user: User, author_id: int) -> bool:
    return user.id == author_id or is_staff(user)


def can_use_category(
    user: User | None, min_role: UserRole | None
) -> bool:
    if min_role is None:
        return True
    if user is None:
        return False
    return ROLE_RANK[user.role] >= ROLE_RANK[min_role]
