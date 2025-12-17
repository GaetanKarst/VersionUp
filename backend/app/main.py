import os

import textwrap
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.clients import strava_client
from app.ai_client import client
from app.auth import get_current_user
from app.firebase_setup import db as firestore_db
from app.models.user_profile import UserProfile
from app.models.workout_request import WorkoutRequest
from app.models.workout_to_save import WorkoutToSave
from services.strava_service import StravaService

load_dotenv()

# TODO: remove
STRAVA_CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
STRAVA_REDIRECT_URI = os.getenv("STRAVA_REDIRECT_URI")

api_router = APIRouter(prefix="/api/v1")
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

# --- Dependencies ---
def get_strava_service():
    return StravaService(firestore_db)


# --- API Endpoints ---
@api_router.get("/")
def read_root():
    return {"message": "VersionsUp API v1"}


@api_router.get("/strava/auth_url")
def get_strava_auth_url(strava_services: StravaService = Depends(get_strava_service)):
    """
    Provides the URL for Strava OAuth authentication.
    """
    return strava_services.get_auth_url()


@api_router.get("/strava/exchange_token")
def exchange_token(code: str = Query(...), 
                   user: dict = Depends(get_current_user), 
                   strava_service: StravaService = Depends(get_strava_service)):
    """
    Exchanges the authorization 'code' from Strava for an access token and refresh token.
    Tokens are stored in Firestore for the authenticated user.
    """
    return strava_service.exchange_token(code, user.get("uid"))

@api_router.get("/strava/status", dependencies=[Depends(get_current_user)])
def get_strava_connection_status(user: dict = Depends(get_current_user),
                                 strava_service: StravaService = Depends(get_strava_service)):
    """
    Checks if the current user has connected their Strava account.
    """
    return strava_service.get_strava_connection_status(user.get("uid"))


@api_router.get("/strava/activities", dependencies=[Depends(get_current_user)])
def list_activities(user: dict = Depends(get_current_user),
                    strava_service: StravaService = Depends(get_strava_service,)):
    """
    Fetches the last 5 activities.
    """
    # TODO: add customizable per_page & pagination
    return strava_service.get_activities(user.get("uid"))

@api_router.put("/user/profile", dependencies=[Depends(get_current_user)])
def update_user_profile(profile: UserProfile, user: dict = Depends(get_current_user)):
    """
    Updates the user's profile information.
    """
    user_uid = user.get("uid")
    try:
        user_doc_ref = firestore_db.collection('users').document(user_uid)
        profile_data = profile.dict(exclude_unset=True)
        if not profile_data:
            raise HTTPException(status_code=400, detail="No profile data provided.")
        user_doc_ref.set({'profile': profile_data}, merge=True)
        return {"message": "Profile updated successfully."}
    except Exception as e:
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile.")


@api_router.get("/user/profile", dependencies=[Depends(get_current_user)])
def get_user_profile(user: dict = Depends(get_current_user)):
    """
    Retrieves the user's profile information.
    """
    user_uid = user.get("uid")
    try:
        user_doc_ref = firestore_db.collection('users').document(user_uid)
        user_doc = user_doc_ref.get()
        if user_doc.exists and 'profile' in user_doc.to_dict():
            return user_doc.to_dict().get('profile')
        return {}
    except Exception as e:
        print(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile.")


@api_router.post("/ai/suggest_workout")
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
        **Specific requirements:** {request.requirements or "no specific requirements"}

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



@api_router.post("/save_workout", dependencies=[Depends(get_current_user)])
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


@api_router.get("/get_workouts", dependencies=[Depends(get_current_user)])
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


@api_router.get("/get_latest_workout", dependencies=[Depends(get_current_user)])
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
        
        
app.include_router(api_router)

