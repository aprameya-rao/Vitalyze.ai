# app/services/storage_service.py

import logging
from google.cloud import storage
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        # Initialize using the same credentials we use for Vertex AI
        try:
            self.client = storage.Client.from_service_account_json(
                settings.GOOGLE_APPLICATION_CREDENTIALS
            )
            # You need to create this bucket name in your GCP Console first!
            self.bucket_name = f"{settings.GCP_PROJECT_ID}-reports" 
        except Exception as e:
            logger.error(f"Failed to init GCS Client: {e}")
            self.client = None

    def upload_file(self, file_obj, destination_blob_name: str) -> str:
        """
        Uploads a file-like object to GCS and returns the public link (or internal path).
        """
        if not self.client:
            logger.error("Storage client not initialized.")
            return ""

        try:
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(destination_blob_name)
            
            # Reset file pointer to start just in case
            file_obj.seek(0)
            blob.upload_from_file(file_obj, content_type="application/pdf")

            logger.info(f"File uploaded to {destination_blob_name}.")
            
            # Return the GCS URI (gs://...) or the public URL if you make it public.
            # For private files, we usually store the path and generate a signed URL later.
            return blob.name 
        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
            raise e

    def generate_signed_url(self, blob_name: str):
        """Generates a temporary URL for the user to view the file."""
        if not self.client: return ""
        bucket = self.client.bucket(self.bucket_name)
        blob = bucket.blob(blob_name)
        
        return blob.generate_signed_url(expiration=3600) # Valid for 1 hour

storage_service = StorageService()