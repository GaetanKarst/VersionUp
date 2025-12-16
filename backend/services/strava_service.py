import os
from dotenv import load_dotenv
from fastapi import HTTPException
from app.clients import strava_client

load_dotenv()


class StravaService:
    def __init__(self, firestore_db):
        self.client_id = os.getenv("STRAVA_CLIENT_ID")
        self.client_secret = os.getenv("STRAVA_CLIENT_SECRET")
        self.redirect_uri = os.getenv("STRAVA_REDIRECT_URI")
        self.firestore_db = firestore_db

        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            raise RuntimeError(
                "Strava environment variables are not properly set")


    def get_auth_url(self):
        if not all([self.client_id, self.redirect_uri]):
            raise HTTPException(
                status_code=500,
                detail="Server configuration error: Strava client details not set."
            )

        authorization_url = strava_client.get_authorization_url(
            client_id=self.client_id,
            redirect_uri=self.redirect_uri,
        )

        return {"authorization_url": authorization_url}

    def exchange_token(self, code: str, user_uid: str):
        try:
            token_data = strava_client.get_tokens(
                client_id=self.client_id,
                client_secret=self.client_secret,
                code=code,
            )

            user_doc_ref = (
                self.firestore_db
                .collection("users")
                .document(user_uid)
            )

            user_doc_ref.set(
                {"strava_tokens": token_data},
                merge=True
            )

            return {"message": "Token exchanged successfully."}

        except Exception as e:
            print(f"Error exchanging token: {e}")
            raise HTTPException(
                status_code=400,
                detail="Failed to exchange token with Strava."
            )
        