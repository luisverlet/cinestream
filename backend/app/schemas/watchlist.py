from pydantic import BaseModel, Field
from typing import Optional, List

class UserRating(BaseModel):
    user_nick: str
    rating: Optional[float] = None
    reaction: Optional[str] = None
    comment: Optional[str] = None
    updated_at: Optional[str] = None

class WatchlistItem(BaseModel):
    id: str
    title: str
    original_title: Optional[str] = None
    type: str = "Movie"             # "Movie" | "Series"
    year: Optional[int] = None
    imdb_id: Optional[str] = None
    imdb_rating: Optional[float] = None
    status: str = "plan_to_watch"   # "plan_to_watch" | "completed"
    ratings: List[UserRating] = []  # Multi-user ratings (Nano, Vane, etc.)
    user_nick: Optional[str] = None # Legacy / primary nick
    user_rating: Optional[float] = None # Legacy / primary rating
    notes: Optional[str] = None
    created_at: str
    updated_at: str
    in_library: bool = False

class RateItemRequest(BaseModel):
    user_nick: str
    rating: Optional[float] = None
    reaction: Optional[str] = None
    comment: Optional[str] = None

class WatchlistCreate(BaseModel):
    title: str
    original_title: Optional[str] = None
    type: str = "Movie"
    year: Optional[int] = None
    imdb_id: Optional[str] = None
    imdb_rating: Optional[float] = None
    status: str = "plan_to_watch"   # "plan_to_watch" | "completed"
    user_nick: Optional[str] = None
    user_rating: Optional[float] = None
    ratings: Optional[List[UserRating]] = None
    notes: Optional[str] = None

class WatchlistUpdate(BaseModel):
    title: Optional[str] = None
    original_title: Optional[str] = None
    type: Optional[str] = None
    year: Optional[int] = None
    imdb_id: Optional[str] = None
    imdb_rating: Optional[float] = None
    status: Optional[str] = None   # "plan_to_watch" | "completed"
    user_nick: Optional[str] = None
    user_rating: Optional[float] = None
    ratings: Optional[List[UserRating]] = None
    notes: Optional[str] = None
