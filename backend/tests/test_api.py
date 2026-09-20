from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import AuthorizedDevice, User
from app.security import hash_password


def test_register_creates_user_and_returns_jwt(client: TestClient):
    response = client.post(
        "/api/auth/register/",
        json={
            "name": "Joana Lima",
            "email": "JOANA@example.com",
            "password": "segura123",
            "phone": "(81) 99999-0000",
            "profession": "Agrônoma",
        },
    )
    assert response.status_code == 201
    assert response.json()["access_token"]
    assert response.json()["user"]["email"] == "joana@example.com"
    me = client.get(
        "/api/auth/me/",
        headers={"Authorization": f"Bearer {response.json()['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["name"] == "Joana Lima"


def test_register_rejects_duplicate_email(client: TestClient):
    response = client.post(
        "/api/auth/register/",
        json={"name": "Outro", "email": "manager@example.com", "password": "segura123"},
    )
    assert response.status_code == 409


def test_register_accepts_url_without_trailing_slash(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json={"name": "Sem Barra", "email": "sembarra@example.com", "password": "segura123"},
    )
    assert response.status_code == 201


def test_register_requires_strong_minimum_password(client: TestClient):
    response = client.post(
        "/api/auth/register/",
        json={"name": "Joana", "email": "joana@example.com", "password": "123"},
    )
    assert response.status_code == 422


def test_login_rejects_invalid_password(client: TestClient):
    response = client.post(
        "/api/auth/login/",
        json={"email": "manager@example.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_farm_crud_is_authenticated(client: TestClient, auth_headers: dict[str, str]):
    assert client.get("/api/devices/farms/").status_code == 401
    created = client.post(
        "/api/devices/farms/",
        headers=auth_headers,
        json={"name": "Fazenda A", "owner_name": "Ana"},
    )
    assert created.status_code == 201
    assert created.json()["manager"] == 1
    listed = client.get("/api/devices/farms/", headers=auth_headers)
    assert [farm["name"] for farm in listed.json()] == ["Fazenda A"]


def test_sensor_allocation_and_reading(
    client: TestClient, db: Session, auth_headers: dict[str, str]
):
    db.add(AuthorizedDevice(mac_address="AA:BB:CC:DD", is_used=False))
    db.commit()
    farm = client.post(
        "/api/devices/farms/",
        headers=auth_headers,
        json={"name": "Fazenda A", "owner_name": "Ana"},
    ).json()
    sensor_response = client.post(
        "/api/devices/sensors/",
        headers=auth_headers,
        json={"mac_address": "AA:BB:CC:DD", "farm": farm["id"]},
    )
    assert sensor_response.status_code == 201
    sensor = sensor_response.json()
    assert sensor["mac_address"] == "AA:BB:CC:DD"

    reading = client.post(
        "/api/devices/readings/",
        headers=auth_headers,
        json={
            "sensor": sensor["id"],
            "dpv_kpa": 1.2,
            "humidity": 65,
            "temperature": 28,
            "battery": 90,
        },
    )
    assert reading.status_code == 201
    assert reading.json()["farm"] == farm["id"]


def test_user_cannot_read_another_users_farm(
    client: TestClient, db: Session, auth_headers: dict[str, str]
):
    other = User(
        email="other@example.com", name="Other", password=hash_password("secret", iterations=1_000)
    )
    db.add(other)
    db.commit()
    other_login = client.post(
        "/api/auth/login/", json={"email": "other@example.com", "password": "secret"}
    ).json()
    other_headers = {"Authorization": f"Bearer {other_login['access_token']}"}
    farm = client.post(
        "/api/devices/farms/",
        headers=other_headers,
        json={"name": "Privada", "owner_name": "Outro"},
    ).json()
    assert client.get(f"/api/devices/farms/{farm['id']}/", headers=auth_headers).status_code == 404
