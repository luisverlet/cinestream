from pydantic import BaseModel
from typing import Optional

class SubtitleFetchRequest(BaseModel):
    item_id: str
    language: str = "spa"

class SubtitleFetchResponse(BaseModel):
    success: bool
    message: str
    subtitle_url: Optional[str] = None
    language: str = "spa"

