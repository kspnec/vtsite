def test_signup(client):
    res = client.post(
        "/auth/signup",
        json={
            "email": "test@village.com",
            "password": "secret123",
            "full_name": "Test User",
            "village_area": "North Street",
        },
    )
    assert res.status_code == 201
    assert "pending" in res.json()["message"].lower()


def test_signup_duplicate_email(client):
    payload = {"email": "dup@village.com", "password": "pass123", "full_name": "User"}
    client.post("/auth/signup", json=payload)
    res = client.post("/auth/signup", json=payload)
    assert res.status_code == 400


def test_login_unapproved(client):
    client.post(
        "/auth/signup",
        json={
            "email": "pending@village.com",
            "password": "pass123",
            "full_name": "Pending User",
        },
    )
    res = client.post(
        "/auth/login", json={"email": "pending@village.com", "password": "pass123"}
    )
    # unapproved users can log in but see pending state
    assert res.status_code == 200
    assert res.json()["user"]["is_approved"] is False


def test_login_wrong_password(client):
    client.post(
        "/auth/signup",
        json={"email": "user@village.com", "password": "right", "full_name": "U"},
    )
    res = client.post(
        "/auth/login", json={"email": "user@village.com", "password": "wrong"}
    )
    assert res.status_code == 401


def test_public_profiles_empty(client):
    res = client.get("/profiles")
    assert res.status_code == 200
    assert res.json() == []
