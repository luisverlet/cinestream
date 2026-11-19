import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    auth_router,
    media_router,
    stream_router,
    torrents_router,
    subtitles_router,
    system_router,
    watchlist_router,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("verlet-cine-bridge")

async def download_completion_monitor():
    """Background monitor that periodically checks for completed downloads and triggers Jellyfin scan"""
    from app.services.qbittorrent import qbittorrent_service
    while True:
        try:
            await asyncio.sleep(8)
            await qbittorrent_service.get_active_torrents()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.debug(f"Download monitor check error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    monitor_task = asyncio.create_task(download_completion_monitor())
    yield
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Verlet-Cine Gateway API",
    description="Backend-for-Frontend ultraligero que conecta la interfaz web con Jellyfin, Prowlarr, qBittorrent y Bazarr",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(media_router)
app.include_router(stream_router)
app.include_router(torrents_router)
app.include_router(subtitles_router)
app.include_router(system_router)
app.include_router(watchlist_router)

@app.get("/")
async def root():
    return {
        "app": "verlet-cine API Bridge",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "jellyfin": settings.JELLYFIN_URL,
            "prowlarr": settings.PROWLARR_URL,
            "qbittorrent": settings.QBITTORRENT_URL,
            "bazarr": settings.BAZARR_URL
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

