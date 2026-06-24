import googlemaps
from googlemaps.exceptions import ApiError
import logging
import requests
from app.core.config import settings

logger = logging.getLogger(__name__)

class MapsService:
    def __init__(self):
        # 1. Initialize Google Maps
        if settings.GOOGLE_MAPS_API_KEY:
            self.gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        else:
            logger.warning("GOOGLE_MAPS_API_KEY not set. Will default to OSM fallback.")
            self.gmaps = None
            
        # 2. Initialize OpenStreetMap (OSM) Config from .env
        self.osm_api_key = getattr(settings, 'OSM_API_KEY', None)
        self.osm_api_url = getattr(settings, 'OSM_API_URL', "https://overpass-api.de/api/interpreter")

    def get_nearby_pharmacies(self, lat: float, lon: float, radius: int = 5000) -> list:
        """
        Fetches nearby pharmacies using Google Places API.
        Falls back to OpenStreetMap if Google API fails or is missing.
        """
        pharmacies = []

        # --- ATTEMPT 1: Google Maps ---
        if self.gmaps:
            try:
                response = self.gmaps.places_nearby(
                    location=(lat, lon),
                    radius=radius,
                    type='pharmacy'
                )

                for place in response.get('results', []):
                    pharmacies.append({
                        'name': place.get('name'),
                        'vicinity': place.get('vicinity'), 
                        'rating': place.get('rating'),     
                        'user_ratings_total': place.get('user_ratings_total'),
                        'geometry': {
                            'lat': place['geometry']['location']['lat'],
                            'lng': place['geometry']['location']['lng']
                        },
                        'place_id': place.get('place_id'),
                        'source': 'google' # Helps frontend know where data came from
                    })
                
                return pharmacies

            except ApiError as e:
                logger.error(f"Google Maps API Error: {e}. Initiating OSM fallback.")
            except Exception as e:
                logger.error(f"Unexpected error in Google Maps service: {e}. Initiating OSM fallback.")
        else:
            logger.warning("Google Maps client not available. Initiating OSM fallback.")

        # --- ATTEMPT 2: OpenStreetMap Fallback ---
        return self._get_osm_pharmacies(lat, lon, radius)

    def _get_osm_pharmacies(self, lat: float, lon: float, radius: int) -> list:
        """
        Fallback method using OpenStreetMap Overpass API.
        Formats the output to perfectly match the Google Places format.
        """
        logger.info("Fetching pharmacies from OpenStreetMap...")
        try:
            # Overpass QL query to find pharmacies
            overpass_query = f"""
            [out:json];
            (
              node["amenity"="pharmacy"](around:{radius},{lat},{lon});
              way["amenity"="pharmacy"](around:{radius},{lat},{lon});
              relation["amenity"="pharmacy"](around:{radius},{lat},{lon});
            );
            out center;
            """
            
            # --- THE FIX ---
            # Overpass API strictly requires an explicit Accept header and a valid User-Agent.
            headers = {
                'User-Agent': 'VitalyzeMedicalLocator/1.0 (contact@yourdomain.com)',
                'Accept': 'application/json'
            }
            
            if self.osm_api_key:
                headers['Authorization'] = f"Bearer {self.osm_api_key}"

            response = requests.post(
                self.osm_api_url, 
                data={'data': overpass_query}, 
                headers=headers, 
                timeout=10
            )
            
            # This will raise the 4xx/5xx error if it still fails
            response.raise_for_status()
            data = response.json()

            pharmacies = []
            for element in data.get('elements', []):
                tags = element.get('tags', {})
                
                # Extract coordinates
                loc_lat = element.get('lat') or element.get('center', {}).get('lat')
                loc_lon = element.get('lon') or element.get('center', {}).get('lon')
                
                if not loc_lat or not loc_lon:
                    continue

                # OSM stores addresses in separate tags. Stitch them together.
                street = tags.get('addr:street', '')
                housenumber = tags.get('addr:housenumber', '')
                city = tags.get('addr:city', '')
                
                vicinity = f"{housenumber} {street}, {city}".strip(' ,')
                if not vicinity:
                    vicinity = "Address not available"

                pharmacies.append({
                    'name': tags.get('name', 'Pharmacy'),
                    'vicinity': vicinity,
                    'rating': None,
                    'user_ratings_total': None,
                    'geometry': {
                        'lat': loc_lat,
                        'lng': loc_lon
                    },
                    'place_id': f"osm_{element.get('type')}_{element.get('id')}",
                    'source': 'osm'
                })
            
            return pharmacies

        except requests.exceptions.RequestException as e:
            # Enhanced error logging to print the exact rejection message from Overpass
            error_details = e.response.text if e.response is not None else "No response body"
            logger.error(f"OpenStreetMap API Error: {e} | Server Details: {error_details}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in OSM fallback: {e}")
            return []

maps_service = MapsService()