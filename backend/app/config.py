from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Monitoramento de Estresse Vegetal"
    debug: bool = False
    jwt_secret_key: str = Field(
        default="vgEtOpX-bUw61_k9GsffcIc1sWi8eCTKNLJO306-Taw",
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY"),
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    email_verification_expire_hours: int = 24
    password_reset_expire_minutes: int = 30
    frontend_url: str = "http://localhost:5173"
    email_backend: str = "console"
    email_from_address: str = "Cultiva <nao-responda@cultiva.local>"
    brevo_api_key: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True
    database_url_value: str | None = Field(default=None, alias="DATABASE_URL")
    db_name: str = "monitoramento"
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_host: str = "localhost"
    db_port: int = 5430
    cors_origins_value: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def database_url(self) -> str:
        if self.database_url_value:
            url = self.database_url_value
            return url.replace("postgres://", "postgresql+psycopg://", 1).replace(
                "postgresql://", "postgresql+psycopg://", 1
            )
        user = quote_plus(self.db_user)
        password = quote_plus(self.db_password)
        return (
            f"postgresql+psycopg://{user}:{password}@"
            f"{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def public_frontend_url(self) -> str:
        return self.frontend_url.rstrip("/")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins_value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
