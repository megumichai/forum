from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import get_session
from app.main import app
from app.models import Base, Category, Post, Topic, User, UserRole
from app.security import hash_password


@pytest.fixture
def session_factory() -> Iterator[sessionmaker[Session]]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    with factory() as session:
        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=hash_password("admin123"),
            display_name="Admin",
            role=UserRole.ADMIN,
        )
        category = Category(
            name="综合讨论",
            slug="general",
            description="General discussion",
        )
        session.add_all([admin, category])
        session.flush()

        topic = Topic(
            category_id=category.id,
            author_id=admin.id,
            title="Hello",
            content="First topic",
        )
        session.add(topic)
        session.flush()

        session.add(
            Post(topic_id=topic.id, author_id=admin.id, content="First reply")
        )
        session.commit()

    yield factory
    engine.dispose()


@pytest.fixture
def client(session_factory: sessionmaker[Session]) -> Iterator[TestClient]:
    def override_get_session() -> Iterator[Session]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
