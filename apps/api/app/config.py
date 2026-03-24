"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://greyzone:greyzone@localhost:5432/greyzone"
    database_url_sync: str = "postgresql://greyzone:greyzone@localhost:5432/greyzone"
    engine_binary: str = "../../services/sim-engine/target/release/greyzone-engine"
    ai_agent_url: str = "http://localhost:3100"
    cors_origins: list[str] = ["http://localhost:5173"]
    log_level: str = "INFO"

    model_config = {"env_prefix": "GREYZONE_"}


settings = Settings()
