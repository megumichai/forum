from fastapi.testclient import TestClient


def login(
    client: TestClient,
    identifier: str = "admin",
    password: str = "admin123",
) -> None:
    response = client.post(
        "/api/auth/login",
        json={"identifier": identifier, "password": password},
    )
    assert response.status_code == 200


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


def create_topic(client: TestClient, title: str = "New topic") -> dict:
    response = client.post(
        "/api/topics",
        json={
            "category_id": 1,
            "title": title,
            "content": "Topic content",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_topic_requires_auth(client: TestClient) -> None:
    response = client.post(
        "/api/topics",
        json={"category_id": 1, "title": "Title", "content": "Content"},
    )
    assert response.status_code == 401


def test_create_topic_and_reply(client: TestClient) -> None:
    login(client)
    topic = create_topic(client, "  Padded title  ")

    assert topic["title"] == "Padded title"
    assert topic["category"]["slug"] == "general"
    assert topic["author"]["username"] == "admin"

    reply = client.post(
        f"/api/topics/{topic['id']}/posts",
        json={"content": "  First reply  "},
    )
    assert reply.status_code == 201
    assert reply.json()["content"] == "First reply"
    assert reply.json()["author"]["username"] == "admin"

    detail = client.get(f"/api/topics/{topic['id']}")
    assert detail.status_code == 200
    assert detail.json()["reply_count"] == 1


def test_reply_requires_auth(client: TestClient) -> None:
    response = client.post("/api/topics/1/posts", json={"content": "Reply"})
    assert response.status_code == 401


def test_locked_topic_blocks_member_reply(client: TestClient) -> None:
    login(client)
    topic = create_topic(client)

    locked = client.patch(
        f"/api/topics/{topic['id']}", json={"is_locked": True}
    )
    assert locked.status_code == 200
    assert locked.json()["is_locked"] is True

    register(client, "member")
    blocked = client.post(
        f"/api/topics/{topic['id']}/posts", json={"content": "Reply"}
    )
    assert blocked.status_code == 409

    login(client)
    allowed = client.post(
        f"/api/topics/{topic['id']}/posts", json={"content": "Staff reply"}
    )
    assert allowed.status_code == 201


def test_member_can_edit_own_topic_but_not_pin(client: TestClient) -> None:
    login(client)
    admin_topic = create_topic(client, "Admin topic")

    register(client, "member")
    own_topic = create_topic(client, "Member topic")

    forbidden = client.patch(
        f"/api/topics/{admin_topic['id']}", json={"title": "Hijacked"}
    )
    assert forbidden.status_code == 403

    updated = client.patch(
        f"/api/topics/{own_topic['id']}", json={"title": "Edited by member"}
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Edited by member"

    pin = client.patch(
        f"/api/topics/{own_topic['id']}", json={"is_pinned": True}
    )
    assert pin.status_code == 403

    login(client)
    pinned = client.patch(
        f"/api/topics/{own_topic['id']}", json={"is_pinned": True}
    )
    assert pinned.status_code == 200
    assert pinned.json()["is_pinned"] is True


def test_edit_and_delete_post(client: TestClient) -> None:
    login(client)
    reply = client.post(
        "/api/topics/1/posts", json={"content": "Original reply"}
    )
    post_id = reply.json()["id"]

    updated = client.patch(
        f"/api/posts/{post_id}", json={"content": "Updated reply"}
    )
    assert updated.status_code == 200
    assert updated.json()["content"] == "Updated reply"

    deleted = client.delete(f"/api/posts/{post_id}")
    assert deleted.status_code == 204
    assert client.patch(
        f"/api/posts/{post_id}", json={"content": "Gone"}
    ).status_code == 404


def test_delete_topic(client: TestClient) -> None:
    login(client)
    topic = create_topic(client)

    deleted = client.delete(f"/api/topics/{topic['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/topics/{topic['id']}").status_code == 404
