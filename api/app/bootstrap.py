import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import or_, select

from .config import BASE_DIR, settings
from .db import SessionLocal
from .models import User, UserRole
from .security import hash_password

logger = logging.getLogger(__name__)


def _ensure_sqlite_directory() -> None:
    prefix = "sqlite:///"
    if not settings.database_url.startswith(prefix):
        return

    database_path = settings.database_url[len(prefix) :]
    if not database_path or database_path == ":memory:":
        return

    Path(database_path).parent.mkdir(parents=True, exist_ok=True)


def run_migrations() -> None:
    _ensure_sqlite_directory()

    config = Config()
    config.set_main_option(
        "script_location", str(BASE_DIR / "migrations")
    )
    config.set_main_option("prepend_sys_path", str(BASE_DIR))
    command.upgrade(config, "head")
    logger.info("Database migrations applied")


def ensure_initial_admin() -> None:
    password = settings.initial_admin_password
    if not password:
        return

    username = settings.initial_admin_username.strip()
    email = settings.initial_admin_email.strip().lower()
    if not username or not email:
        raise RuntimeError(
            "FORUM_INITIAL_ADMIN_USERNAME 和 "
            "FORUM_INITIAL_ADMIN_EMAIL 不能为空"
        )
    if len(password) < 8:
        raise RuntimeError(
            "FORUM_INITIAL_ADMIN_PASSWORD 至少需要 8 个字符"
        )

    with SessionLocal() as session:
        admin_exists = session.scalar(
            select(User.id).where(User.role == UserRole.ADMIN).limit(1)
        )
        if admin_exists is not None:
            return

        existing = session.scalar(
            select(User).where(
                or_(User.username == username, User.email == email)
            )
        )
        if existing is not None:
            raise RuntimeError(
                "无法创建初始管理员：用户名或邮箱已被占用"
            )

        admin = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            display_name="Admin",
            role=UserRole.ADMIN,
        )
        session.add(admin)
        session.commit()
        logger.info("Initial admin user '%s' created", username)
