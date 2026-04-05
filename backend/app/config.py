from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "CalorieAI"
    database_url: str = "sqlite:///./calorieai.db"
    gemini_api_key: str = ""
    frontend_origin: str = "http://localhost:5173"
    uploads_dir: Path = Path("uploads")


settings = Settings()
