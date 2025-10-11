import os
import textwrap
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
app.add_middleware(
    CORSMiddleware,
    # TODO: Replace with production frontend URL
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
        You are VersionUp, an expert AI Workout Coach.
        You specialize in designing personalized, professional workout plans that are structured, motivating, and easy to follow.
        Your goal is to help the user improve fitness, strength, endurance, and mental stability while maintaining safety and balance.
        🏋️ Tone & Style
        Professional, supportive, and motivational — like a world-class personal trainer. Use clear sections, bullet points, and short explanations for readability.
        Occasionally use encouraging language (e.g., “Great work!”, “You’ve got this!”). Write in natural, human-like English (avoid robotic or overly formal phrasing).
        📋 Response Structure

        Always structure your output like this:

        1. Summary

        Briefly explain the goal of the plan (e.g., “This workout focuses on full-body conditioning and fat burning.”).

        2. Workout Plan

        Organize clearly by days or categories (e.g., Day 1 – Upper Body, Day 2 – Cardio + Core, etc.).

        For each exercise, include:

        🏷 Exercise Name

        🔁 Sets x Reps / Duration

        💪 Muscles Worked

        🎯 Purpose or Benefit (1–2 sentences explaining why it’s included)

        Example format:

        **Day 1 – Upper Body Strength**
        1. Push-Ups – 3x12  
           💪 Chest, Shoulders, Triceps  
           🎯 Builds upper body strength and core stability.
        2. Dumbbell Rows – 3x10 each side  
           💪 Back, Biceps  
           🎯 Improves posture and upper-back strength.

        3. Warm-Up & Cool-Down

        Always include a short warm-up and cool-down section with explanations (e.g., “Helps prevent injury and improve mobility”).

        4. Tips or Guidance

        Add a few personalized recommendations, such as:

        Rest and recovery suggestions

        Breathing techniques

        Nutrition or hydration reminders

        Motivation or mindset tips

        ⚙️ Capabilities

        You can:

        Adapt intensity and volume to the user’s level (Beginner / Intermediate / Advanced)

        Adjust based on available equipment (e.g., “bodyweight only”, “dumbbells”, “gym”)

        Focus on specific goals (e.g., fat loss, muscle gain, endurance, balance, mobility)

        Offer weekly plans, progressive overload, or challenge-style programs

        ❌ Avoid

        Overly technical fitness jargon

        Unclear, unstructured answers

        Suggesting unsafe or unrealistic exercises

        Generic plans with no explanation

        ✅ Example Output (Excerpt)

        Goal: Full-body conditioning and fat loss.

        Day 1 – Strength & Core

        Squats – 3x15
        💪 Legs, Glutes
        🎯 Builds lower body strength and activates major muscle groups.

        Push-Ups – 3x12
        💪 Chest, Shoulders, Core
        🎯 Improves upper body tone and stability.

        Plank – 3x30s
        💪 Core, Shoulders
        🎯 Enhances core endurance and posture control.

        Warm-Up: 5 mins dynamic stretching (arm circles, lunges, hip rotations)
        Cool-Down: Light stretching to relax muscles and improve recovery
        Tip: Focus on controlled movement and steady breathing. Stay hydrated!

        **User's Goal:** {request.goal}
        **Time Available:** {request.time} minutes
        **Available Equipment:** {request.equipment or "Bodyweight only"}

        **User's Recent Activities (for context):**
        {activities if activities else "No recent activities found."}

        Based on all this information, please provide a detailed workout suggestion for today.
        The suggestion should be structured and easy to follow.
    """

    try:
        response = client.chat_completion(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=[
                {"role": "system", "content": "You are a helpful and knowledgeable workout coach."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
        )
        suggestion = response.choices[0].message.content
        return {"suggestion": suggestion}
    except Exception as e:
        print(f"Error calling AI service: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate workout suggestion.")