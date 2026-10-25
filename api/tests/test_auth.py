from fastapi.testclient import TestClient


def test_register_and_me(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123",
            "display_name": "New User",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "newuser"
    assert body["email"] == "new@example.com"
    assert body["display_name"] == "New User"
    assert body["role"] == "user"

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "newuser"


def test_register_duplicate(client: TestClient) -> None:
    payload = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "password123",
    }

    assert client.post("/api/auth/register", json=payload).status_code == 201

    duplicate = client.post(
        "/api/auth/register",
        json={**payload, "email": "other@example.com"},
    )
    assert duplicate.status_code == 409


def test_login_and_logout(client: TestClient) -> None:
    login = client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "admin123"},
    )
    assert login.status_code == 200
    assert login.json()["username"] == "admin"

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["role"] == "admin"

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_login_with_email(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"identifier": "ADMIN@example.com", "password": "admin123"},
    )
    assert response.status_code == 200


def test_login_with_wrong_password(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/api/auth/me").status_code == 401


def test_register_validates_password_length(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "username": "shortpass",
            "email": "short@example.com",
            "password": "short",
        },
    )
    assert response.status_code == 422
