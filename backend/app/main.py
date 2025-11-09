import os
import sys
import textwrap
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from app import strava_client
from app.ai_client import client
from app.auth import get_current_user
from app.firebase_setup import db as firestore_db
from fastapi import Request

load_dotenv()

STRAVA_CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
STRAVA_REDIRECT_URI = os.getenv("STRAVA_REDIRECT_URI")

NBR_OF_ACTIVITIES = 5

app = FastAPI(
    title="VersionsUp - AI Workout Trainer API",
    description="API for fetching sport activity data and providing AI-powered workout suggestions.",
    version="1.0.0",
)

# --- CORS Middleware ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "https://versionsup.com",
    "https://www.versionsup.com",
    "https://versionsup.vercel.app",
    "https://www.versionsup.vercel.app",
    "https://www.strava.com",
    "https://versionup-api-195732093685.asia-northeast1.run.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],

)

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
        raise HTTPException(
            status_code=500, detail="Server configuration error: Strava client details not set.")

    authorization_url = strava_client.get_authorization_url(
        client_id=STRAVA_CLIENT_ID,
        redirect_uri=STRAVA_REDIRECT_URI
    )
    return {"authorization_url": authorization_url}


@app.get("/exchange_token")
def exchange_token(code: str = Query(...), user: dict = Depends(get_current_user)):
    """
    Exchanges the authorization 'code' from Strava for an access token and refresh token.
    Tokens are stored in Firestore for the authenticated user.
    """
    if not all([STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET]):
        raise HTTPException(
            status_code=500, detail="Server configuration error: Strava client details not set.")

    user_uid = user.get("uid")
    try:
        token_data = strava_client.get_tokens(
            client_id=STRAVA_CLIENT_ID,
            client_secret=STRAVA_CLIENT_SECRET,
            code=code
        )
        # Store tokens in Firestore, linked to the user's UID
        user_doc_ref = firestore_db.collection('users').document(user_uid)
        user_doc_ref.set({'strava_tokens': token_data}, merge=True)

        return {"message": "Token exchanged successfully."}
    except Exception as e:
        print(f"Error exchanging token: {e}")
        raise HTTPException(
            status_code=400, detail="Failed to exchange token with Strava.")


@app.get("/strava/status", dependencies=[Depends(get_current_user)])
def get_strava_connection_status(user: dict = Depends(get_current_user)):
    """
    Checks if the current user has connected their Strava account.
    """
    user_uid = user.get("uid")
    user_doc = firestore_db.collection('users').document(user_uid).get()

    is_connected = (user_doc.exists and
                    'strava_tokens' in user_doc.to_dict() and
                    user_doc.to_dict().get('strava_tokens', {}).get('access_token') is not None)

    return {"is_connected": is_connected}


@app.get("/activities", dependencies=[Depends(get_current_user)])
def list_activities(user: dict = Depends(get_current_user)):
    """
    Fetches the last 5 activities.
    """
    user_uid = user.get("uid")
    user_doc = firestore_db.collection('users').document(user_uid).get()
    if not user_doc.exists or 'strava_tokens' not in user_doc.to_dict():
        raise HTTPException(
            status_code=401, detail="Strava account not connected.")

    access_token = user_doc.to_dict()['strava_tokens'].get('access_token')
    if not access_token:
        raise HTTPException(status_code=401, detail="Invalid Strava token.")

    try:
        activities = strava_client.get_activities(
            access_token=access_token, per_page=NBR_OF_ACTIVITIES)
        return activities
    except Exception as e:
        print(f"Error fetching activities: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch activities from Strava.")


@app.post("/suggest_workout")
def suggest_workout(request: WorkoutRequest, user: dict = Depends(get_current_user)):
    """
    Generates a workout suggestion based on user's goals and recent activities.
    """
    user_uid = user.get("uid")
    activities = []
    is_strava_connected = False

    user_doc = firestore_db.collection('users').document(user_uid).get()
    if user_doc.exists and 'strava_tokens' in user_doc.to_dict():
        access_token = user_doc.to_dict()['strava_tokens'].get('access_token')
        if access_token:
            is_strava_connected = True
            try:
                activities = strava_client.get_activities(
                    access_token=access_token, per_page=NBR_OF_ACTIVITIES)
            except Exception as e:
                print(f"Error fetching activities for AI suggestion: {e}")
                activities = []

    activities_str = '\n'.join(
        map(str, activities)) if activities else "No recent activities found."

    prompt = textwrap.dedent(f"""
        You are VersionsUp, an expert AI Workout Coach.
        You specialize in designing personalized, professional workout plans that are structured, motivating, and easy to follow.
        Your goal is to help the user improve fitness, strength, endurance, and mental stability while maintaining safety and balance.
        You always analyse past activities and use them to provide adapted plans to the user so that there can be a progression and they can reach their objectives.

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

        Adapt intensity and volume to the user’s level (Beginner / Intermediate / Advanced) as well as previous performance during activity history

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
        **Time Available:** {request.time} minutes per workout
        **Available Equipment:** {request.equipment or "Bodyweight only"}

        **User's Strava Connection Status:** {'Connected' if is_strava_connected else 'Not Connected'}
        **User's Recent Activities (for context):** {activities_str}

        Based on all this information, please provide a detailed workout suggestion.
        The suggestion should be structured and easy to follow.

        If the user's Strava is not connected, your primary goal is to provide a great general workout based on their stated goal, but also gently encourage them to connect their Strava account for a more personalized experience in the future. Mention this in the "Tips or Guidance" section.
    """)

    try:
        response = client.chat_completion(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=[
                {"role": "system",
                    "content": "You are a helpful and knowledgeable workout coach."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
        )
        suggestion = response.choices[0].message.content
        return {"suggestion": suggestion}
    except Exception as e:
        print(f"Error calling AI service: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to generate workout suggestion.")


class WorkoutToSave(BaseModel):
    suggestion: str


@app.post("/save_workout", dependencies=[Depends(get_current_user)])
def save_workout(workout: WorkoutToSave, user: dict = Depends(get_current_user)):
    """
    Saves a workout suggestion for the current user.
    """
    user_uid = user.get("uid")
    if not user_uid:
        raise HTTPException(status_code=403, detail="User not authenticated.")

    try:
        workout_ref = firestore_db.collection(
            'users').document(user_uid).collection('workouts').document()
        workout_ref.set({
            'suggestion': workout.suggestion,
            'created_at': datetime.utcnow()
        })
        return {"message": "Workout saved successfully.", "workout_id": workout_ref.id}
    except Exception as e:
        print(f"Error saving workout: {e}")
        raise HTTPException(status_code=500, detail="Failed to save workout.")


@app.get("/get_workouts", dependencies=[Depends(get_current_user)])
def get_workouts(user: dict = Depends(get_current_user)):
    """
    Retrieves all saved workouts for the current user.
    """
    user_uid = user.get("uid")
    if not user_uid:
        raise HTTPException(status_code=403, detail="User not authenticated.")

    try:
        workouts_ref = firestore_db.collection(
            'users').document(user_uid).collection('workouts').stream()
        
        workouts = []
        for workout in workouts_ref:
            workout_data = workout.to_dict()
            workout_data['id'] = workout.id
            workouts.append(workout_data)

        workouts.sort(key=lambda x: x.get('created_at'), reverse=True)

        return workouts
    except Exception as e:
        print(f"Error fetching workouts: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch workouts.")


@app.get("/get_latest_workout", dependencies=[Depends(get_current_user)])
def get_latest_workout(user: dict = Depends(get_current_user)):
    """
    Retrieves the latest saved workout for the current user.
    """
    user_uid = user.get("uid")
    if not user_uid:
        raise HTTPException(status_code=403, detail="User not authenticated.")

    try:
        workouts_ref = firestore_db.collection(
            'users').document(user_uid).collection('workouts').order_by(
                'created_at', direction='DESCENDING').limit(1).stream()
        
        workouts = []
        for workout in workouts_ref:
            workout_data = workout.to_dict()
            workout_data['id'] = workout.id
            workouts.append(workout_data)

        return workouts
    except Exception as e:
        print(f"Error fetching latest workout: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch latest workout.")
        