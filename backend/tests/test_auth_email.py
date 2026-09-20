from sqlalchemy import select

from app.models import User
from app.security import create_email_verification_token, create_password_reset_token
from tests.conftest import TestingSession


def register(client, email: str = "produtor@example.com"):
    return client.post(
        "/api/auth/register/",
        json={
            "name": "Produtor Teste",
            "email": email,
            "password": "senha-segura-123",
        },
    )


def load_user(email: str = "produtor@example.com") -> User:
    with TestingSession() as db:
        return db.scalar(select(User).where(User.email == email))


def test_registration_requires_email_verification_before_login(client):
    response = register(client)
    assert response.status_code == 201
    assert "access_token" not in response.json()

    blocked = client.post(
        "/api/auth/login/",
        json={"email": "produtor@example.com", "password": "senha-segura-123"},
    )
    assert blocked.status_code == 403

    user = load_user()
    assert user.email_verified is False
    token = create_email_verification_token(user.id, user.email)
    confirmed = client.post("/api/auth/verify-email/", json={"token": token})
    assert confirmed.status_code == 200

    login = client.post(
        "/api/auth/login/",
        json={"email": "produtor@example.com", "password": "senha-segura-123"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["email_verified"] is True


def test_password_reset_invalidates_link_after_first_use(client):
    register(client)
    user = load_user()
    token = create_password_reset_token(user.id, user.email, user.password)

    reset = client.post(
        "/api/auth/reset-password/",
        json={"token": token, "new_password": "uma-nova-senha-456"},
    )
    assert reset.status_code == 200

    replay = client.post(
        "/api/auth/reset-password/",
        json={"token": token, "new_password": "outra-senha-789"},
    )
    assert replay.status_code == 400

    old_login = client.post(
        "/api/auth/login/",
        json={"email": user.email, "password": "senha-segura-123"},
    )
    assert old_login.status_code == 401
    new_login = client.post(
        "/api/auth/login/",
        json={"email": user.email, "password": "uma-nova-senha-456"},
    )
    assert new_login.status_code == 200


def test_forgot_password_does_not_reveal_if_account_exists(client):
    register(client)
    known = client.post("/api/auth/forgot-password/", json={"email": "produtor@example.com"})
    unknown = client.post("/api/auth/forgot-password/", json={"email": "ninguem@example.com"})
    assert known.status_code == 200
    assert unknown.status_code == 200
    assert known.json() == unknown.json()


def test_action_endpoints_reject_wrong_or_invalid_token_type(client):
    register(client)
    user = load_user()
    reset_token = create_password_reset_token(user.id, user.email, user.password)
    verification_token = create_email_verification_token(user.id, user.email)

    assert client.post("/api/auth/verify-email/", json={"token": reset_token}).status_code == 400
    assert client.post(
        "/api/auth/reset-password/",
        json={"token": verification_token, "new_password": "senha-valida-123"},
    ).status_code == 400
    assert client.post("/api/auth/verify-email/", json={"token": "invalido"}).status_code == 400
