import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.config import get_settings


PBKDF2_ITERATIONS = 1_000_000


def hash_password(password: str, iterations: int = PBKDF2_ITERATIONS) -> str:
    """Gera hash compatível com o formato pbkdf2_sha256 do Django."""
    salt = secrets.token_urlsafe(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), iterations)
    encoded = base64.b64encode(digest).decode("ascii")
    return f"pbkdf2_sha256${iterations}${salt}${encoded}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations))
        actual = base64.b64encode(digest).decode("ascii")
        return hmac.compare_digest(actual, expected)
    except (TypeError, ValueError):
        return False


def create_access_token(user_id: int) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int:
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Tipo de token inválido")
    return int(payload["sub"])


def _create_action_token(
    user_id: int,
    email: str,
    token_type: str,
    expires_delta: timedelta,
    **claims: str,
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + expires_delta,
        "type": token_type,
        **claims,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _decode_action_token(token: str, expected_type: str) -> dict:
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Tipo de token inválido")
    if not payload.get("sub") or not payload.get("email"):
        raise jwt.InvalidTokenError("Token incompleto")
    return payload


def create_email_verification_token(user_id: int, email: str) -> str:
    settings = get_settings()
    return _create_action_token(
        user_id,
        email,
        "email_verification",
        timedelta(hours=settings.email_verification_expire_hours),
    )


def decode_email_verification_token(token: str) -> dict:
    return _decode_action_token(token, "email_verification")


def password_fingerprint(encoded_password: str) -> str:
    return hashlib.sha256(encoded_password.encode()).hexdigest()


def create_password_reset_token(user_id: int, email: str, encoded_password: str) -> str:
    settings = get_settings()
    return _create_action_token(
        user_id,
        email,
        "password_reset",
        timedelta(minutes=settings.password_reset_expire_minutes),
        password_fingerprint=password_fingerprint(encoded_password),
    )


def decode_password_reset_token(token: str) -> dict:
    return _decode_action_token(token, "password_reset")


def password_reset_token_matches(payload: dict, encoded_password: str) -> bool:
    fingerprint = payload.get("password_fingerprint")
    return isinstance(fingerprint, str) and hmac.compare_digest(
        fingerprint,
        password_fingerprint(encoded_password),
    )
