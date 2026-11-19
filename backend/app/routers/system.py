import shutil
import os
import logging
from fastapi import APIRouter
from app.schemas.system import StorageInfo

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/system", tags=["Sistema"])

@router.get("/storage", response_model=StorageInfo)
async def get_storage_info():
    """
    Returns real-time disk space usage where media and downloads are stored.
    Evaluates warning and critical low-disk thresholds to alert the user.
    """
    target_path = "/media/movies"
    if not os.path.exists(target_path):
        target_path = "/media"
    if not os.path.exists(target_path):
        target_path = "."

    try:
        total, used, free = shutil.disk_usage(target_path)
    except Exception as e:
        logger.warning(f"Error reading disk usage from {target_path}: {e}")
        total, used, free = shutil.disk_usage(".")

    total_gb = round(total / (1024 ** 3), 1)
    used_gb = round(used / (1024 ** 3), 1)
    free_gb = round(free / (1024 ** 3), 1)
    used_percentage = round((used / total) * 100, 1) if total > 0 else 0.0

    is_critical = free_gb < 5.0
    is_low = free_gb < 15.0

    warning_msg = None
    if is_critical:
        warning_msg = f"¡Espacio crítico en disco! Solo quedan {free_gb} GB libres. Debes eliminar películas vistas para poder descargar nuevo contenido."
    elif is_low:
        warning_msg = f"Espacio en disco bajo: Te quedan {free_gb} GB libres de {total_gb} GB."

    return StorageInfo(
        total_bytes=total,
        used_bytes=used,
        free_bytes=free,
        total_gb=total_gb,
        used_gb=used_gb,
        free_gb=free_gb,
        used_percentage=used_percentage,
        is_low_space=is_low,
        is_critical=is_critical,
        warning_message=warning_msg
    )

