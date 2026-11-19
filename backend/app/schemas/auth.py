from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    user_id: str
    username: str
    access_token: str
    server_id: Optional[str] = None

class UserSession(BaseModel):
    user_id: str
    username: str
    is_authenticated: bool

