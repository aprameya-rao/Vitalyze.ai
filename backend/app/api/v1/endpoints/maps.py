from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from app.services.maps_service import maps_service

router = APIRouter()

# --- Response Models ---
class Geometry(BaseModel):
    lat: float
    lng: float

class Pharmacy(BaseModel):
    name: str
    vicinity: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    geometry: Geometry
    place_id: str

@router.get("/pharmacies", response_model=List[Pharmacy])
def get_nearby_pharmacies(
    lat: float = Query(..., description="Latitude of the user"),
    lng: float = Query(..., description="Longitude of the user"),
    radius: int = Query(5000, description="Search radius in meters (default 5km)")
):
    """
    Get list of pharmacies near the provided coordinates.
    """
    results = maps_service.get_nearby_pharmacies(lat, lng, radius)
    
    if not results and maps_service.gmaps is None:
         raise HTTPException(status_code=503, detail="Maps service unavailable (API Key missing)")
         
    return results