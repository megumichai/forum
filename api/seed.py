from sqlalchemy import select

from app.db import SessionLocal, engine
from app.models import Base, User, UserRole
from app.security import hash_password

ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


def seed() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        existing = session.scalar(
            select(User).where(User.username == ADMIN_USERNAME)
        )
        if existing is not None:
            print(f"Admin user '{ADMIN_USERNAME}' already exists.")
            return

        session.add(
            User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                display_name="Admin",
                role=UserRole.ADMIN,
            )
        )
        session.commit()
        print(f"Admin user '{ADMIN_USERNAME}' created.")


if __name__ == "__main__":
    seed()
