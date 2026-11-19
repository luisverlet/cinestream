from pydantic import BaseModel
from typing import Optional

class StorageInfo(BaseModel):
    total_bytes: int
    used_bytes: int
    free_bytes: int
    total_gb: float
    used_gb: float
    free_gb: float
    used_percentage: float
    is_low_space: bool
    is_critical: bool
    warning_message: Optional[str] = None

