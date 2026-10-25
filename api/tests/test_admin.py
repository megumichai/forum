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
