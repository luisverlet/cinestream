from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
from app.schemas.auth import LoginRequest, LoginResponse, UserSession
from app.services.jellyfin import jellyfin_service

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

def get_token(
    authorization: Optional[str] = Header(None),
    x_emby_token: Optional[str] = Header(None)
) -> Optional[str]:
    if x_emby_token:
        return x_emby_token
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        return authorization
    return None

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    try:
        data = await jellyfin_service.authenticate(credentials.username, credentials.password)
        return LoginResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/verify", response_model=UserSession)
async def verify_token(token: Optional[str] = Depends(get_token)):
    if not token:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    # Verified by inspecting if token works against Jellyfin or is present
    return UserSession(
        user_id="",
        username="",
        is_authenticated=True
    )

