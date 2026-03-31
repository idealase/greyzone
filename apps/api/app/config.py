"""Application configuration via environment variables."""

import os


class Settings:
    database_url: str
    database_url_sync: str
    engine_binary: str
    ai_agent_url: str
    cors_origins: list[str]
    log_level: str
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_minutes: int

    def __init__(self) -> None:
        self.database_url = os.environ.get(
            "GREYZONE_DATABASE_URL",
            "postgresql+asyncpg://greyzone:greyzone@localhost:5432/greyzone",
        )
        self.database_url_sync = os.environ.get(
            "GREYZONE_DATABASE_URL_SYNC",
            "postgresql://greyzone:greyzone@localhost:5432/greyzone",
        )
        self.engine_binary = os.environ.get(
            "GREYZONE_ENGINE_BINARY",
            "../../services/sim-engine/target/release/greyzone-engine",
        )
        self.ai_agent_url = os.environ.get(
            "GREYZONE_AI_AGENT_URL", "http://localhost:3100"
        )
        cors_raw = os.environ.get(
            "GREYZONE_CORS_ORIGINS", "http://localhost:5173"
        )
        self.cors_origins = [s.strip() for s in cors_raw.split(",") if s.strip()]
        self.log_level = os.environ.get("GREYZONE_LOG_LEVEL", "INFO")
        self.jwt_secret_key = os.environ.get(
            "GREYZONE_JWT_SECRET_KEY", "development-insecure-secret-change-me"
        )
        environment = os.environ.get("GREYZONE_ENV", "development").lower()
        if (
            environment not in ["development", "dev", "test"]
            and self.jwt_secret_key == "development-insecure-secret-change-me"
        ):
            raise ValueError(
                "GREYZONE_JWT_SECRET_KEY must be set outside development/test environments"
            )
        self.jwt_algorithm = os.environ.get("GREYZONE_JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(
            os.environ.get("GREYZONE_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
        )
        self.refresh_token_expire_minutes = int(
            os.environ.get("GREYZONE_REFRESH_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))
        )


settings = Settings()
