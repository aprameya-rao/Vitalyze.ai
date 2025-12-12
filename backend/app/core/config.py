from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

    MONGO_URI: str
    MONGO_DB_NAME: str

    REDIS_URL: str
    
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    WHATSAPP_API_VERSION: str
    WHATSAPP_ACCESS_TOKEN: str  
    WHATSAPP_PHONE_NUMBER_ID: str
    WHATSAPP_VERIFY_TOKEN: str 

    GOOGLE_MAPS_API_KEY: str

    GCP_PROJECT_ID: str
    GCP_LOCATION: str
    GOOGLE_APPLICATION_CREDENTIALS: str

settings = Settings()