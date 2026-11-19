import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    ENVIRONMENT: str = "production"
    SECRET_KEY: str = "verlet-cine-super-secret-key-change-in-production"

    # Jellyfin
    JELLYFIN_URL: str = "http://jellyfin:8096"
    JELLYFIN_API_KEY: str = ""
    JELLYFIN_CLIENT_NAME: str = "verlet-cine"
    JELLYFIN_DEVICE_ID: str = "verlet-cine-web"
    JELLYFIN_VERSION: str = "1.0.0"

    # Prowlarr
    PROWLARR_URL: str = "http://prowlarr:9696"
    PROWLARR_API_KEY: str = ""

    # qBittorrent
    QBITTORRENT_URL: str = "http://qbittorrent:8080"
    QBITTORRENT_USER: str = "admin"
    QBITTORRENT_PASS: str = "adminadmin"

    # Bazarr
    BAZARR_URL: str = "http://bazarr:6767"
    BAZARR_API_KEY: str = ""

    # Save paths inside qBittorrent container
    QBITTORRENT_MOVIES_PATH: str = "/media/movies"
    QBITTORRENT_TV_PATH: str = "/media/tv"

    # OpenSubtitles (Opcional para descarga directa de subtítulos)
    OPENSUBTITLES_API_KEY: str = ""
    OPENSUBTITLES_USER: str = ""
    OPENSUBTITLES_PASS: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

