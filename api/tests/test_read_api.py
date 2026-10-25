from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_categories(client: TestClient) -> None:
    response = client.get("/api/categories")
    assert response.status_code == 200
    assert response.json()[0]["slug"] == "general"


def test_get_category(client: TestClient) -> None:
    response = client.get("/api/categories/general")
    assert response.status_code == 200
    assert response.json()["name"] == "综合讨论"


def test_get_missing_category(client: TestClient) -> None:
    response = client.get("/api/categories/missing")
    assert response.status_code == 404


def test_list_topics(client: TestClient) -> None:
    response = client.get("/api/topics")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert body["items"][0]["category"]["slug"] == "general"
    assert body["items"][0]["reply_count"] == 1


def test_list_topics_by_category(client: TestClient) -> None:
    response = client.get("/api/topics", params={"category": "general"})
    assert response.status_code == 200
    assert response.json()["total"] == 1

    response = client.get("/api/topics", params={"category": "missing"})
    assert response.status_code == 200
    assert response.json()["total"] == 0


def test_get_topic_does_not_increment_views(client: TestClient) -> None:
    first = client.get("/api/topics/1")
    second = client.get("/api/topics/1")

    assert first.status_code == 200
    assert first.json()["view_count"] == 0
    assert second.json()["view_count"] == 0
    assert "posts" not in first.json()


def test_view_endpoint_increments_views(client: TestClient) -> None:
    first = client.post("/api/topics/1/view")
    second = client.post("/api/topics/1/view")

    assert first.status_code == 200
    assert first.json() == {"view_count": 1}
    assert second.json() == {"view_count": 2}
    assert client.get("/api/topics/1").json()["view_count"] == 2


def test_view_endpoint_does_not_change_last_activity(client: TestClient) -> None:
    before = client.get("/api/topics/1").json()["updated_at"]
    client.post("/api/topics/1/view")
    after = client.get("/api/topics/1").json()["updated_at"]
    assert after == before


def test_view_missing_topic(client: TestClient) -> None:
    assert client.post("/api/topics/999/view").status_code == 404


def test_get_missing_topic(client: TestClient) -> None:
    response = client.get("/api/topics/999")
    assert response.status_code == 404


def test_list_topic_posts(client: TestClient) -> None:
    response = client.get("/api/topics/1/posts")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["content"] == "First reply"


def test_list_topic_posts_pagination(client: TestClient) -> None:
    login = client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "admin123"},
    )
    assert login.status_code == 200

    for index in range(3):
        created = client.post(
            "/api/topics/1/posts", json={"content": f"Reply {index}"}
        )
        assert created.status_code == 201

    first = client.get(
        "/api/topics/1/posts", params={"page": 1, "page_size": 2}
    ).json()
    second = client.get(
        "/api/topics/1/posts", params={"page": 2, "page_size": 2}
    ).json()

    assert first["total"] == 4
    assert len(first["items"]) == 2
    assert len(second["items"]) == 2
    assert first["items"][0]["content"] != second["items"][0]["content"]


def test_get_user(client: TestClient) -> None:
    response = client.get("/api/users/admin")
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "admin"
    assert body["topic_count"] == 1
    assert body["post_count"] == 1


def test_get_missing_user(client: TestClient) -> None:
    response = client.get("/api/users/missing")
    assert response.status_code == 404
