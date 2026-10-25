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


def test_update_profile(client: TestClient) -> None:
    client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "admin123"},
    )

    response = client.patch(
        "/api/auth/me",
        json={
            "display_name": "Admin Renamed",
            "email": "boss@example.com",
            "bio": "  Hello there  ",
            "avatar_url": "https://example.com/avatar.png",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "Admin Renamed"
    assert body["email"] == "boss@example.com"
    assert body["bio"] == "Hello there"
    assert body["avatar_url"] == "https://example.com/avatar.png"

    topic = client.get("/api/topics/1").json()
    assert topic["author"]["avatar_url"] == "https://example.com/avatar.png"


def test_update_profile_clears_fields(client: TestClient) -> None:
    client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "admin123"},
    )

    cleared = client.patch(
        "/api/auth/me", json={"bio": "Something", "avatar_url": None}
    )
    assert cleared.status_code == 200
    assert cleared.json()["bio"] == "Something"
    assert cleared.json()["avatar_url"] is None

    emptied = client.patch("/api/auth/me", json={"bio": ""})
    assert emptied.status_code == 200
    assert emptied.json()["bio"] is None


def test_update_profile_rejects_duplicate_email(client: TestClient) -> None:
    client.post(
        "/api/auth/register",
        json={
            "username": "member",
            "email": "member@example.com",
            "password": "password123",
        },
    )
    client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "admin123"},
    )

    response = client.patch(
        "/api/auth/me", json={"email": "member@example.com"}
    )
    assert response.status_code == 409


def test_update_profile_validates_avatar_url(client: TestClient) -> None:
    client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "admin123"},
    )

    response = client.patch(
        "/api/auth/me", json={"avatar_url": "javascript:alert(1)"}
    )
    assert response.status_code == 400


def test_update_profile_requires_auth(client: TestClient) -> None:
    response = client.patch("/api/auth/me", json={"display_name": "Nope"})
    assert response.status_code == 401


def test_change_password(client: TestClient) -> None:
    client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "admin123"},
    )

    wrong = client.patch(
        "/api/auth/password",
        json={
            "current_password": "wrong-password",
            "new_password": "new-password-123",
        },
    )
    assert wrong.status_code == 400

    same = client.patch(
        "/api/auth/password",
        json={
            "current_password": "admin123",
            "new_password": "admin123",
        },
    )
    assert same.status_code == 400

    changed = client.patch(
        "/api/auth/password",
        json={
            "current_password": "admin123",
            "new_password": "new-password-123",
        },
    )
    assert changed.status_code == 204

    client.post("/api/auth/logout")

    old_login = client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "admin123"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "new-password-123"},
    )
    assert new_login.status_code == 200
