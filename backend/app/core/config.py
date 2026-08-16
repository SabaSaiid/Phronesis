import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Phronesis"
    API_V1_STR: str = "/api/v1"
    
    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # "gemini", "openai", "anthropic", "mock"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.5-flash"
    
    # Server & Security
    HOST: str = "0.0.0.0"
    PORT: int = 8010
    CORS_ORIGINS: str = "http://localhost:5180,http://127.0.0.1:5180,http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
