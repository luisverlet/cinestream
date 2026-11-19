import uuid
from fastapi import APIRouter, HTTPException, Depends, Header, Query, Request
from fastapi.responses import RedirectResponse, StreamingResponse, Response
from typing import Optional
from pydantic import BaseModel
import httpx
from app.schemas.media import MediaItem, MediaDetail, EpisodeItem, QualityOption, StreamInfoResponse
from app.services.jellyfin import jellyfin_service
from app.config import settings
from app.routers.media import extract_token_and_user

router = APIRouter(prefix="/api/stream", tags=["Streaming"])

QUALITY_CONFIGS = [
    {
        "id": "720p",
        "label": "720p HD (YouTube Fluida - Recomendada)",
        "max_width": 1280,
        "max_height": 720,
        "video_bitrate": 1400000,
        "max_bitrate": 1900000
    },
    {
        "id": "1080p",
        "label": "1080p FHD (Alta Calidad)",
        "max_width": 1920,
        "max_height": 1080,
        "video_bitrate": 2800000,
        "max_bitrate": 3600000
    },
    {
        "id": "480p",
        "label": "480p SD (Ahorro de datos)",
        "max_width": 854,
        "max_height": 480,
        "video_bitrate": 750000,
        "max_bitrate": 950000
    },
    {
        "id": "360p",
        "label": "360p (Móvil Lento)",
        "max_width": 640,
        "max_height": 360,
        "video_bitrate": 400000,
        "max_bitrate": 550000
    }
]

def make_hls_url(item_id: str, ms_id: str, token: str, cfg: dict, play_session_id: str) -> str:
    params = [
        f"DeviceId={settings.JELLYFIN_DEVICE_ID}",
        f"MediaSourceId={ms_id}",
        f"PlaySessionId={play_session_id}",
        "VideoCodec=h264",
        "AudioCodec=aac",
        "AudioBitRate=128000",
        "TranscodingMaxAudioChannels=2",
        "SegmentContainer=ts",
        "MinSegments=2",          # Pre-generate 2 segments antes de empezar
        "SegmentLength=6",        # Segmentos de 6s (menos roundtrips que 3s)
        # BreakOnNonKeyFrames eliminado: causaba micro-pausas frecuentes en HEVC
        f"MaxWidth={cfg['max_width']}",
        f"MaxHeight={cfg['max_height']}",
        f"VideoBitRate={cfg['video_bitrate']}",
        f"MaxStreamingBitrate={cfg['max_bitrate']}",
        "EnableSubtitlesInManifest=false",  # false: subtítulos via VTT overlay, no en manifest
        f"ApiKey={token}"
    ]
    return f"/jellyfin/Videos/{item_id}/master.m3u8?{'&'.join(params)}"

class ProgressReport(BaseModel):
    position_ticks: int
    is_paused: bool = False
    play_session_id: Optional[str] = None
    media_source_id: Optional[str] = None

@router.get("/{item_id}/info", response_model=StreamInfoResponse)
async def get_stream_info(
    item_id: str,
    media_source_id: Optional[str] = None,
    auth: tuple = Depends(extract_token_and_user)
):
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")

    detail = await jellyfin_service.get_item_detail(item_id, user_id, token)
    if not detail:
        raise HTTPException(status_code=404, detail="Medio no encontrado")

    ms_id = media_source_id or detail.media_source_id or item_id
    stream_key = settings.JELLYFIN_API_KEY or token
    play_session_id = uuid.uuid4().hex

    # Register active playing session with Jellyfin SessionManager
    await jellyfin_service.report_playing(item_id, play_session_id, ms_id, stream_key)

    # Proactively check if Spanish subtitles should be fetched if none exist
    has_spanish_sub = any(
        (t.language or "").lower() in ["spa", "es", "spanish"] or
        "español" in (t.title or "").lower() or
        "spanish" in (t.title or "").lower()
        for t in detail.subtitle_tracks
    )

    if not has_spanish_sub:
        try:
            from app.services.subtitles import subtitle_service
            fetch_res = await subtitle_service.search_and_download_spanish(item_id, token)
            if fetch_res.get("success"):
                updated_detail = await jellyfin_service.get_item_detail(item_id, user_id, token)
                if updated_detail and updated_detail.subtitle_tracks:
                    detail = updated_detail
        except Exception as e:
            logger.warning(f"Error auto-fetching Spanish subtitles for stream: {e}")

    container_lower = (detail.container or "").lower()
    is_mp4 = "mp4" in container_lower or "m4v" in container_lower
    codec_lower = (detail.video_codec or "").lower()
    is_h264 = any(c in codec_lower for c in ["h264", "avc", "avc1"])

    is_direct_compatible = is_mp4 and is_h264
    direct_url = f"/jellyfin/Videos/{item_id}/stream?static=true&MediaSourceId={ms_id}&ApiKey={stream_key}"

    # Build quality variants with persistent PlaySessionId
    hls_720p_url = make_hls_url(item_id, ms_id, stream_key, QUALITY_CONFIGS[0], play_session_id)
    hls_1080p_url = make_hls_url(item_id, ms_id, stream_key, QUALITY_CONFIGS[1], play_session_id)
    hls_480p_url = make_hls_url(item_id, ms_id, stream_key, QUALITY_CONFIGS[2], play_session_id)
    hls_360p_url = make_hls_url(item_id, ms_id, stream_key, QUALITY_CONFIGS[3], play_session_id)

    if is_direct_compatible:
        # Browser-compatible MP4/H.264: Default to Direct Play (0% CPU, instant buffering, zero freezes!)
        default_hls = direct_url
        qualities = [
            QualityOption(
                id="direct",
                label="Direct Play (Original - Cero procesamiento / 0% CPU)",
                hls_url=direct_url,
                video_bitrate=15000000,
                max_height=1080
            ),
            QualityOption(
                id="720p",
                label="720p HD (Ahorro de datos - Caracas)",
                hls_url=hls_720p_url,
                video_bitrate=QUALITY_CONFIGS[0]["video_bitrate"],
                max_height=QUALITY_CONFIGS[0]["max_height"]
            ),
            QualityOption(
                id="1080p",
                label="1080p FHD (Transcodificado)",
                hls_url=hls_1080p_url,
                video_bitrate=QUALITY_CONFIGS[1]["video_bitrate"],
                max_height=QUALITY_CONFIGS[1]["max_height"]
            ),
            QualityOption(
                id="480p",
                label="480p SD (Conexión lenta)",
                hls_url=hls_480p_url,
                video_bitrate=QUALITY_CONFIGS[2]["video_bitrate"],
                max_height=QUALITY_CONFIGS[2]["max_height"]
            ),
            QualityOption(
                id="360p",
                label="360p (Móvil Lento / Cantv)",
                hls_url=hls_360p_url,
                video_bitrate=QUALITY_CONFIGS[3]["video_bitrate"],
                max_height=QUALITY_CONFIGS[3]["max_height"]
            )
        ]
    else:
        # Browser-incompatible format (MKV, HEVC, AVI): Jellyfin MUST transcode/remux via HLS
        # Default to 720p HD HLS: lightest real-time transcode profile to avoid CPU bottleneck
        default_hls = hls_720p_url
        qualities = [
            QualityOption(
                id="720p",
                label="720p HD (Fluida / Recomendada - YouTube)",
                hls_url=hls_720p_url,
                video_bitrate=QUALITY_CONFIGS[0]["video_bitrate"],
                max_height=QUALITY_CONFIGS[0]["max_height"]
            ),
            QualityOption(
                id="1080p",
                label="1080p FHD (Alta Calidad)",
                hls_url=hls_1080p_url,
                video_bitrate=QUALITY_CONFIGS[1]["video_bitrate"],
                max_height=QUALITY_CONFIGS[1]["max_height"]
            ),
            QualityOption(
                id="480p",
                label="480p SD (Ahorro de datos / Conexión lenta)",
                hls_url=hls_480p_url,
                video_bitrate=QUALITY_CONFIGS[2]["video_bitrate"],
                max_height=QUALITY_CONFIGS[2]["max_height"]
            ),
            QualityOption(
                id="360p",
                label="360p (Móvil Lento / Cantv)",
                hls_url=hls_360p_url,
                video_bitrate=QUALITY_CONFIGS[3]["video_bitrate"],
                max_height=QUALITY_CONFIGS[3]["max_height"]
            )
        ]

    return StreamInfoResponse(
        item_id=item_id,
        name=detail.name,
        media_source_id=ms_id,
        play_session_id=play_session_id,
        hls_url=default_hls,
        direct_url=direct_url,
        container=detail.container,
        video_codec=detail.video_codec,
        playback_position_ticks=detail.playback_position_ticks or 0,
        subtitle_tracks=detail.subtitle_tracks,
        audio_tracks=detail.audio_tracks,
        qualities=qualities
    )

@router.post("/{item_id}/progress")
async def report_progress(
    item_id: str,
    body: ProgressReport,
    auth: tuple = Depends(extract_token_and_user)
):
    token, user_id = auth
    await jellyfin_service.report_progress(
        item_id=item_id,
        position_ticks=body.position_ticks,
        is_paused=body.is_paused,
        token=token or settings.JELLYFIN_API_KEY,
        play_session_id=body.play_session_id,
        media_source_id=body.media_source_id
    )
    return {"status": "ok"}

@router.post("/{item_id}/stopped")
async def report_stopped(
    item_id: str,
    body: ProgressReport,
    auth: tuple = Depends(extract_token_and_user)
):
    token, user_id = auth
    await jellyfin_service.report_stopped(
        item_id=item_id,
        position_ticks=body.position_ticks,
        token=token or settings.JELLYFIN_API_KEY,
        play_session_id=body.play_session_id
    )
    return {"status": "ok"}

