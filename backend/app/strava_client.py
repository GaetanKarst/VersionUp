import requests
from typing import Dict, Any, List

STRAVA_API_BASE_URL = "https://www.strava.com/api/v3"
STRAVA_OAUTH_URL = "https://www.strava.com/oauth"

def get_authorization_url(client_id: str, redirect_uri: str) -> str:
    """
    Constructs the Strava OAuth authorization URL.
    """
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "approval_prompt": "auto",
        "scope": "read,activity:read_all",
    }
    auth_url = f"{STRAVA_OAUTH_URL}/authorize?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    return auth_url

def get_tokens(client_id: str, client_secret: str, code: str) -> Dict[str, Any]:
    """
    Exchanges authorization code to access and refresh tokens.
    """
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
    }
    response = requests.post(f"{STRAVA_OAUTH_URL}/token", data=payload)
    response.raise_for_status()
    return response.json()

def get_activities(access_token: str, per_page: int = 5) -> List[Dict[str, Any]]:
    """
    Fetches the latest activities
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"per_page": per_page, "page": 1}
    response = requests.get(f"{STRAVA_API_BASE_URL}/athlete/activities", headers=headers, params=params)
    response.raise_for_status()
    return response.json()