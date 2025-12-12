import googlemaps
from googlemaps.exceptions import ApiError
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class MapsService:
    def __init__(self):
        if settings.GOOGLE_MAPS_API_KEY:
            self.gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        else:
            logger.warning("GOOGLE_MAPS_API_KEY not set. Maps service will not function.")
            self.gmaps = None

    def get_nearby_pharmacies(self, lat: float, lon: float, radius: int = 5000) -> list:
        """
        Fetches nearby pharmacies using Google Places API.
        Returns a list of simplified pharmacy objects for the frontend.
        """
        if not self.gmaps:
            logger.error("Google Maps client not initialized.")
            return []

        try:
            response = self.gmaps.places_nearby(
                location=(lat, lon),
                radius=radius,
                type='pharmacy'
            )

            pharmacies = []
            for place in response.get('results', []):
                pharmacies.append({
                    'name': place.get('name'),
                    'vicinity': place.get('vicinity'), # Nice to have: street address
                    'rating': place.get('rating'),     # Nice to have: user rating
                    'user_ratings_total': place.get('user_ratings_total'),
                    'geometry': {
                        'lat': place['geometry']['location']['lat'],
                        'lng': place['geometry']['location']['lng']
                    },
                    'place_id': place.get('place_id') # Useful for linking to Google Maps
                })
            
            return pharmacies

        except ApiError as e:
            logger.error(f"Google Maps API Error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in maps service: {e}")
            return []

maps_service = MapsService()