from fastapi.testclient import TestClient


def login(
    client: TestClient,
    identifier: str = "admin",
    password: str = "admin123",
) -> dict:
    response = client.post(
        "/api/auth/login",
        json={"identifier": identifier, "password": password},
    )
    assert response.status_code == 200
    return response.json()


def register(client: TestClient, username: str = "member") -> dict:
    response = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    return response.json()


def create_category(
    client: TestClient,
    name: str,
    slug: str,
    min_role: str | None = None,
) -> dict:
    response = client.post(
        "/api/admin/categories",
        json={
            "name": name,
            "slug": slug,
            "description": f"{name} 分类",
            "min_role": min_role,
        },
    )
    assert response.status_code == 201
    return response.json()


def create_topic(
    client: TestClient, category_id: int, title: str
) -> dict:
    response = client.post(
        "/api/topics",
        json={
            "category_id": category_id,
            "title": title,
            "content": "Topic content",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_admin_requires_auth(client: TestClient) -> None:
    assert client.get("/api/admin/stats").status_code == 401


def test_admin_rejects_non_admin(client: TestClient) -> None:
    register(client)
    assert client.get("/api/admin/stats").status_code == 403


def test_admin_stats(client: TestClient) -> None:
    login(client)
    response = client.get("/api/admin/stats")

    assert response.status_code == 200
    body = response.json()
    assert body["users"] == 1
    assert body["topics"] == 1
    assert body["posts"] == 1
    assert body["views"] == 0
    assert body["new_users_7d"] == 1
    assert body["new_topics_7d"] == 1
    assert body["new_posts_7d"] == 1
    assert len(body["categories"]) == 2
    assert body["categories"][0]["slug"] == "general"
    assert body["categories"][0]["topic_count"] == 1


def test_admin_lists_users_and_updates_role(client: TestClient) -> None:
    member = register(client)
    admin = login(client)

    users = client.get("/api/admin/users", params={"search": "member"})
    assert users.status_code == 200
    body = users.json()
    assert body["total"] == 1
    assert body["items"][0]["role"] == "user"
    assert body["items"][0]["topic_count"] == 0

    promoted = client.patch(
        f"/api/admin/users/{member['id']}/role",
        json={"role": "moderator"},
    )
    assert promoted.status_code == 200
    assert promoted.json()["role"] == "moderator"

    self_change = client.patch(
        f"/api/admin/users/{admin['id']}/role",
        json={"role": "user"},
    )
    assert self_change.status_code == 400

    missing = client.patch(
        "/api/admin/users/999/role", json={"role": "user"}
    )
    assert missing.status_code == 404


def test_admin_lists_and_manages_topics_and_posts(
    client: TestClient,
) -> None:
    login(client)

    topics = client.get("/api/admin/topics")
    assert topics.status_code == 200
    assert topics.json()["total"] == 1
    assert topics.json()["items"][0]["reply_count"] == 1

    pinned = client.patch(
        "/api/admin/topics/1", json={"is_pinned": True, "is_locked": True}
    )
    assert pinned.status_code == 200
    assert pinned.json()["is_pinned"] is True
    assert pinned.json()["is_locked"] is True

    moved = client.patch("/api/admin/topics/1", json={"category_id": 2})
    assert moved.status_code == 200
    assert moved.json()["category"]["slug"] == "announcements"

    posts = client.get("/api/admin/posts", params={"search": "First"})
    assert posts.status_code == 200
    assert posts.json()["total"] == 1
    assert posts.json()["items"][0]["topic"]["title"] == "Hello"

    deleted_post = client.delete("/api/admin/posts/1")
    assert deleted_post.status_code == 204
    assert client.get("/api/admin/posts").json()["total"] == 0

    deleted_topic = client.delete("/api/admin/topics/1")
    assert deleted_topic.status_code == 204
    assert client.get("/api/topics/1").status_code == 404


def test_admin_creates_announcement(client: TestClient) -> None:
    login(client)

    response = client.post(
        "/api/admin/announcements",
        json={"title": "维护通知", "content": "今晚 23:00 进行维护。"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["category"]["slug"] == "announcements"
    assert body["is_pinned"] is True
    assert body["reply_count"] == 0

    detail = client.get(f"/api/topics/{body['id']}")
    assert detail.status_code == 200
    assert detail.json()["content"] == "今晚 23:00 进行维护。"

    listed = client.get(
        "/api/topics", params={"category": "announcements"}
    )
    assert listed.json()["total"] == 1


def test_admin_creates_category(client: TestClient) -> None:
    login(client)

    response = client.post(
        "/api/admin/categories",
        json={
            "name": "管理区",
            "slug": "staff-zone",
            "description": "Only admins can use this category",
            "min_role": "admin",
        },
    )
    assert response.status_code == 201
    category = response.json()
    assert category["slug"] == "staff-zone"
    assert category["min_role"] == "admin"
    assert category["topic_count"] == 0

    listed = client.get("/api/admin/categories")
    assert listed.status_code == 200
    assert any(item["id"] == category["id"] for item in listed.json())

    duplicate = client.post(
        "/api/admin/categories",
        json={"name": "管理区", "slug": "another-slug"},
    )
    assert duplicate.status_code == 409


def test_non_admin_cannot_manage_categories(client: TestClient) -> None:
    register(client)

    created = client.post(
        "/api/admin/categories",
        json={"name": "用户区", "slug": "user-zone"},
    )
    assert created.status_code == 403
    assert client.get("/api/admin/categories").status_code == 403


def test_admin_updates_category_access(client: TestClient) -> None:
    login(client)
    category = create_category(client, "会员区", "members", "user")

    updated = client.patch(
        f"/api/admin/categories/{category['id']}",
        json={"min_role": "moderator"},
    )
    assert updated.status_code == 200
    assert updated.json()["min_role"] == "moderator"

    cleared = client.patch(
        f"/api/admin/categories/{category['id']}", json={"min_role": None}
    )
    assert cleared.status_code == 200
    assert cleared.json()["min_role"] is None


def test_category_access_control(client: TestClient) -> None:
    login(client)
    member = register(client)
    login(client)

    members = create_category(client, "会员区", "members", "user")
    moderators = create_category(client, "版主区", "moderators", "moderator")
    staff_only = create_category(client, "管理区", "admin-only", "admin")

    members_topic = create_topic(client, members["id"], "Members topic")
    admin_topic = create_topic(client, staff_only["id"], "Admin topic")

    client.cookies.clear()
    anonymous_slugs = {
        category["slug"]
        for category in client.get("/api/categories").json()
    }
    assert "members" in anonymous_slugs
    assert "moderators" in anonymous_slugs
    assert "admin-only" in anonymous_slugs
    assert client.get("/api/categories/members").status_code == 200
    assert client.get(f"/api/topics/{members_topic['id']}").status_code == 200
    assert client.get(f"/api/topics/{admin_topic['id']}").status_code == 200
    assert client.get("/api/users/admin/topics").json()["total"] == 3
    assert (
        client.get(
            "/api/categories", params={"for_posting": True}
        ).status_code
        == 401
    )

    login(client, identifier="member", password="password123")
    member_postable = {
        category["slug"]
        for category in client.get(
            "/api/categories", params={"for_posting": True}
        ).json()
    }
    assert "members" in member_postable
    assert "moderators" not in member_postable
    assert "admin-only" not in member_postable

    blocked = client.post(
        "/api/topics",
        json={
            "category_id": staff_only["id"],
            "title": "Blocked topic",
            "content": "Should not be created",
        },
    )
    assert blocked.status_code == 403
    assert (
        client.post(
            "/api/topics",
            json={
                "category_id": moderators["id"],
                "title": "Blocked moderator topic",
                "content": "Should not be created",
            },
        ).status_code
        == 403
    )

    allowed = create_topic(client, members["id"], "Member topic")
    assert allowed["category"]["slug"] == "members"
    assert client.get(f"/api/topics/{admin_topic['id']}").status_code == 200

    login(client, identifier="admin", password="admin123")
    promoted = client.patch(
        f"/api/admin/users/{member['id']}/role",
        json={"role": "moderator"},
    )
    assert promoted.status_code == 200

    login(client, identifier="member", password="password123")
    moderator_postable = {
        category["slug"]
        for category in client.get(
            "/api/categories", params={"for_posting": True}
        ).json()
    }
    assert "moderators" in moderator_postable
    assert "admin-only" not in moderator_postable
    create_topic(client, moderators["id"], "Moderator topic")

    login(client, identifier="admin", password="admin123")
    admin_postable = {
        category["slug"]
        for category in client.get(
            "/api/categories", params={"for_posting": True}
        ).json()
    }
    assert "admin-only" in admin_postable
    create_topic(client, staff_only["id"], "Admin-created topic")
    assert moderators["min_role"] == "moderator"
