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
        
    def get_strava_connection_status(self, user_uid: str):
        user_doc = self.firestore_db.collection('users').document(user_uid).get()

        is_connected = (user_doc.exists and
                        'strava_tokens' in user_doc.to_dict() and
                        user_doc.to_dict().get('strava_tokens', {}).get('access_token') is not None)

        return {"is_connected": is_connected}

    def get_activities(self, user_uid: str, per_page: int = 15):
        user_doc = self.firestore_db.collection('users').document(user_uid).get()

        if not user_doc.exists or 'strava_tokens' not in user_doc.to_dict():
            raise HTTPException(
                status_code=401, detail="Strava account not connected.")

        access_token = user_doc.to_dict()['strava_tokens'].get('access_token')

        if not access_token:
            raise HTTPException(status_code=401, detail="Invalid Strava token.")

        try:
            activities = strava_client.get_activities(
                access_token=access_token, per_page=per_page)
            return activities
        except Exception as e:
            print(f"Error fetching activities: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to fetch activities from Strava.")
