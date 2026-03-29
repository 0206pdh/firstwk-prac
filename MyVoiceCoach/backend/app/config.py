from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str
    elevenlabs_api_key: str
    app_env: str = "development"
    max_audio_duration_seconds: int = 180

    class Config:
        env_file = ".env"


settings = Settings()
