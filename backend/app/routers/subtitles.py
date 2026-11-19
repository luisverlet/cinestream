from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from app.schemas.subtitles import SubtitleFetchResponse
from app.services.subtitles import subtitle_service
from app.routers.media import extract_token_and_user

router = APIRouter(prefix="/api/subtitles", tags=["Subtítulos"])

@router.get("/fetch/{item_id}", response_model=SubtitleFetchResponse)
async def fetch_spanish_subtitles(
    item_id: str,
    auth: tuple = Depends(extract_token_and_user)
):
    token, user_id = auth
    result = await subtitle_service.search_and_download_spanish(item_id, token)
    return SubtitleFetchResponse(**result)

