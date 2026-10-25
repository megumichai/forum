from sqlalchemy import select

from app.db import SessionLocal, engine
from app.models import Base, Category, Post, Topic, User, UserRole
from app.security import hash_password

ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

CATEGORIES = (
    ("站务公告", "announcements", "站点公告与规则说明"),
    ("综合讨论", "general", "任何话题都可以在这里讨论"),
    ("技术交流", "tech", "编程、开发与技术相关话题"),
)

TOPICS = (
    (
        "announcements",
        "欢迎来到论坛",
        "欢迎加入！在这里介绍一下你自己，或者开始第一个话题吧。",
        ("有任何问题都可以在这里留言。",),
    ),
    (
        "general",
        "大家平时都用什么技术栈？",
        "想了解一下大家常用的语言、框架和工具。",
        (
            "Python + FastAPI，前端用 Preact。",
            "数据库这边刚换成 SQLAlchemy 2.0。",
        ),
    ),
    (
        "general",
        "周末有什么推荐的电影？",
        "最近想找几部轻松一点的电影看看。",
        ("推荐《心灵奇旅》，很适合放松。",),
    ),
    (
        "tech",
        "SQLAlchemy 2.0 的写法",
        "Mapped 和 mapped_column 的类型提示完整了很多。",
        ("同意，配合 dataclass 风格的模型更清晰。",),
    ),
)


def seed() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        admin = session.scalar(
            select(User).where(User.username == ADMIN_USERNAME)
        )
        if admin is None:
            admin = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                display_name="Admin",
                role=UserRole.ADMIN,
            )
            session.add(admin)
            session.flush()
            print(f"Admin user '{ADMIN_USERNAME}' created.")
        else:
            print(f"Admin user '{ADMIN_USERNAME}' already exists.")

        categories: dict[str, Category] = {}
        for name, slug, description in CATEGORIES:
            category = session.scalar(
                select(Category).where(Category.slug == slug)
            )
            if category is None:
                category = Category(
                    name=name, slug=slug, description=description
                )
                session.add(category)
                session.flush()
                print(f"Category '{name}' created.")
            else:
                print(f"Category '{name}' already exists.")
            categories[slug] = category

        for slug, title, content, replies in TOPICS:
            category = categories[slug]
            topic = session.scalar(
                select(Topic).where(
                    Topic.title == title,
                    Topic.category_id == category.id,
                )
            )
            if topic is not None:
                print(f"Topic '{title}' already exists.")
                continue

            topic = Topic(
                category_id=category.id,
                author_id=admin.id,
                title=title,
                content=content,
            )
            session.add(topic)
            session.flush()

            for reply in replies:
                session.add(
                    Post(
                        topic_id=topic.id,
                        author_id=admin.id,
                        content=reply,
                    )
                )

            print(f"Topic '{title}' created with {len(replies)} replies.")

        session.commit()


if __name__ == "__main__":
    seed()
