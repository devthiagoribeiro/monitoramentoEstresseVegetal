from types import SimpleNamespace

from app import mailer
from app.config import Settings


def test_cors_origins_accept_comma_separated_environment_value():
    settings = Settings(
        _env_file=None,
        CORS_ORIGINS="https://site.example, https://admin.example/",
    )
    assert settings.cors_origins == ["https://site.example", "https://admin.example"]


def test_brevo_backend_sends_transactional_email_over_https(monkeypatch):
    settings = SimpleNamespace(
        email_backend="brevo",
        brevo_api_key="test-api-key",
        email_from_address="Cultiva <cultiva@example.com>",
    )
    captured = {}

    class Response:
        def raise_for_status(self):
            return None

    def fake_post(url, **kwargs):
        captured["url"] = url
        captured.update(kwargs)
        return Response()

    monkeypatch.setattr(mailer, "get_settings", lambda: settings)
    monkeypatch.setattr(mailer.httpx, "post", fake_post)

    mailer._send_email("user@example.com", "Assunto", "Texto", "<p>Texto</p>")

    assert captured["url"] == "https://api.brevo.com/v3/smtp/email"
    assert captured["headers"]["api-key"] == "test-api-key"
    assert captured["json"]["sender"] == {
        "name": "Cultiva",
        "email": "cultiva@example.com",
    }
    assert captured["json"]["to"] == [{"email": "user@example.com"}]


def test_readiness_checks_database(client):
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_health_accepts_uptimerobot_default_head_request(client):
    response = client.head("/health")
    assert response.status_code == 200
    assert response.content == b""
