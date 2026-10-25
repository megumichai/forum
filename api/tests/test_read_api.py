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


def test_get_topic_increments_view_count(client: TestClient) -> None:
    first = client.get("/api/topics/1")
    second = client.get("/api/topics/1")

    assert first.status_code == 200
    assert first.json()["view_count"] == 1
    assert second.json()["view_count"] == 2
    assert len(first.json()["posts"]) == 1


def test_get_missing_topic(client: TestClient) -> None:
    response = client.get("/api/topics/999")
    assert response.status_code == 404


def test_list_topic_posts(client: TestClient) -> None:
    response = client.get("/api/topics/1/posts")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["content"] == "First reply"


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
