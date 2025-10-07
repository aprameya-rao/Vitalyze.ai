from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Load settings from the .env file located one directory up
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding='utf-8')

    # MongoDB settings
    MONGO_URI: str
    MONGO_DB_NAME: str

    # Redis settings (NEW)
    REDIS_URL: str

# Create a single instance of the settings
settings = Settings()