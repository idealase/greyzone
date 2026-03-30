"""Application configuration via environment variables."""

import os


class Settings:
    database_url: str
    database_url_sync: str
    engine_binary: str
    ai_agent_url: str
    cors_origins: list[str]
    log_level: str

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


settings = Settings()
