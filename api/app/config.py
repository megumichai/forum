from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_prefix="FORUM_",
        extra="ignore",
    )

    app_name: str = "Forum"
    database_url: str = Field(
        default=f"sqlite:///{(DATA_DIR / 'forum.db').as_posix()}",
        validation_alias="FORUM_DATABASE",
    )
    secret_key: str = "dev-only-secret-key-change-me-in-production"
    session_cookie: str = "forum_session"
    session_max_age: int = 60 * 60 * 24 * 7
    cookie_secure: bool = False
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "https://forum.do.netlify.app"
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @field_validator("database_url")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        if "://" in value:
            return value
        path = Path(value)
        if not path.is_absolute():
            path = DATA_DIR / path
        return f"sqlite:///{path.as_posix()}"


settings = Settings()
