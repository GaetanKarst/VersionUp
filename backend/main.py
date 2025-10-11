import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import strava_client
from ai_client import client

load_dotenv()

STRAVA_CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
STRAVA_REDIRECT_URI = os.getenv("STRAVA_REDIRECT_URI")

NBR_OF_ACTIVITIES = 5

app = FastAPI(
    title="VersionUp - AI Workout Trainer API",
    description="API for fetching sport activity data and providing AI-powered workout suggestions.",
    version="1.0.0",
)

# --- CORS Middleware ---
# This allows the frontend (running on localhost:3000) to communicate with the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory Token Storage ---
# TODO: Replace with session management system
token_storage = {}

# --- Pydantic Models ---
class WorkoutRequest(BaseModel):
    goal: str = Field(..., example="Build Endurance")
    equipment: str = Field("", example="Dumbbells, resistance bands")
    time: int = Field(..., gt=0, example=45)


# --- API Endpoints ---

@app.get("/")
def get_strava_auth_url():
    """
    Provides the URL for Strava OAuth authentication.
    """
    if not all([STRAVA_CLIENT_ID, STRAVA_REDIRECT_URI]):
        raise HTTPException(status_code=500, detail="Server configuration error: Strava client details not set.")
    
    authorization_url = strava_client.get_authorization_url(
        client_id=STRAVA_CLIENT_ID,
        redirect_uri=STRAVA_REDIRECT_URI
    )
    return {"authorization_url": authorization_url}

@app.get("/exchange_token")
def exchange_token(code: str = Query(...)):
    """
    Exchanges the authorization 'code' from Strava for an access token and refresh token.
    Tokens are stored in memory for subsequent API calls.
    """
    if not all([STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET]):
        raise HTTPException(status_code=500, detail="Server configuration error: Strava client details not set.")

    try:
        token_data = strava_client.get_tokens(
            client_id=STRAVA_CLIENT_ID,
            client_secret=STRAVA_CLIENT_SECRET,
            code=code
        )
        # Store tokens in in-memory storage
        token_storage['access_token'] = token_data.get('access_token')
        token_storage['refresh_token'] = token_data.get('refresh_token')
        token_storage['expires_at'] = token_data.get('expires_at')
        
        return {"message": "Token exchanged successfully."}
    except Exception as e:
        print(f"Error exchanging token: {e}")
        raise HTTPException(status_code=400, detail="Failed to exchange token with Strava.")

@app.get("/activities")
def list_activities():
    """
    Fetches the last 5 activities.
    """
    access_token = token_storage.get('access_token')
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated. Please connect to Strava first.")

    try:
        activities = strava_client.get_activities(access_token=access_token, per_page = NBR_OF_ACTIVITIES)
        return activities
    except Exception as e:
        print(f"Error fetching activities: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch activities from Strava.")

@app.post("/suggest_workout")
def suggest_workout(request: WorkoutRequest):
    """
    Generates a workout suggestion based on user's goals and recent activities.
    """
    access_token = token_storage.get('access_token')
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated. Please connect to Strava first.")

    try:
        activities = strava_client.get_activities(access_token=access_token, per_page=NBR_OF_ACTIVITIES)
    except Exception as e:
        print(f"Error fetching activities for AI suggestion: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch activities from Strava.")

    prompt = f"""
    You are an expert workout coach. Your task is to create a personalized workout plan.

    **User's Goal:** {request.goal}
    **Time Available:** {request.time} minutes
    **Available Equipment:** {request.equipment or "Bodyweight only"}

    **User's Recent Activities (for context):**
    {activities if activities else "No recent activities found."}

    Based on all this information, please provide a detailed workout suggestion for today.
    The suggestion should be structured and easy to follow.
    """

    try:
        response = client.chat.completions.create(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=[
                {"role": "system", "content": "You are a helpful and knowledgeable workout coach."},
                {"role": "user", "content": prompt}
            ]
        )
        suggestion = response.choices[0].message.content
        return {"suggestion": suggestion}
    except Exception as e:
        print(f"Error calling AI service: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate workout suggestion.")