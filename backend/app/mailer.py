import logging
import smtplib
from email.message import EmailMessage
from email.utils import parseaddr
from urllib.parse import quote

import httpx

from app.config import get_settings
from app.security import create_email_verification_token, create_password_reset_token


logger = logging.getLogger(__name__)


def _send_email(recipient: str, subject: str, text: str, html: str) -> None:
    settings = get_settings()
    backend = settings.email_backend.lower()
    if backend == "console":
        logger.warning("E-mail de desenvolvimento\nPara: %s\nAssunto: %s\n%s", recipient, subject, text)
        return
    if backend == "brevo":
        if not settings.brevo_api_key:
            raise RuntimeError("BREVO_API_KEY precisa ser configurada para envio pela Brevo.")
        sender_name, sender_email = parseaddr(settings.email_from_address)
        if not sender_email:
            raise RuntimeError("EMAIL_FROM_ADDRESS precisa conter um endereço válido.")
        response = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": settings.brevo_api_key,
                "content-type": "application/json",
            },
            json={
                "sender": {"name": sender_name or "Cultiva", "email": sender_email},
                "to": [{"email": recipient}],
                "subject": subject,
                "htmlContent": html,
            },
            timeout=15,
        )
        response.raise_for_status()
        return
    if backend != "smtp":
        raise RuntimeError("EMAIL_BACKEND deve ser 'console', 'brevo' ou 'smtp'.")
    if not settings.smtp_host:
        raise RuntimeError("SMTP_HOST precisa ser configurado para envio por SMTP.")

    message = EmailMessage()
    message["From"] = settings.email_from_address
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password or "")
        server.send_message(message)


def send_verification_email(user_id: int, email: str, name: str) -> None:
    settings = get_settings()
    token = create_email_verification_token(user_id, email)
    url = f"{settings.public_frontend_url}/verificar-email?token={quote(token)}"
    subject = "Confirme seu e-mail na Cultiva"
    text = (
        f"Olá, {name}.\n\nConfirme seu e-mail para acessar a Cultiva:\n{url}\n\n"
        f"Este link expira em {settings.email_verification_expire_hours} horas."
    )
    html = (
        f"<p>Olá, {name}.</p><p>Confirme seu e-mail para acessar a Cultiva:</p>"
        f'<p><a href="{url}">Confirmar meu e-mail</a></p>'
        f"<p>Este link expira em {settings.email_verification_expire_hours} horas.</p>"
    )
    _send_email(email, subject, text, html)


def send_password_reset_email(
    user_id: int,
    email: str,
    name: str,
    encoded_password: str,
) -> None:
    settings = get_settings()
    token = create_password_reset_token(user_id, email, encoded_password)
    url = f"{settings.public_frontend_url}/redefinir-senha?token={quote(token)}"
    subject = "Redefina sua senha da Cultiva"
    text = (
        f"Olá, {name}.\n\nUse o link para criar uma nova senha:\n{url}\n\n"
        f"Este link expira em {settings.password_reset_expire_minutes} minutos. "
        "Se você não fez essa solicitação, ignore este e-mail."
    )
    html = (
        f"<p>Olá, {name}.</p><p>Use o link para criar uma nova senha:</p>"
        f'<p><a href="{url}">Redefinir minha senha</a></p>'
        f"<p>Este link expira em {settings.password_reset_expire_minutes} minutos. "
        "Se você não fez essa solicitação, ignore este e-mail.</p>"
    )
    _send_email(email, subject, text, html)
