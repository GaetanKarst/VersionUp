interface StravaActivity {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  type: string;
  start_date_local: string;
}

interface Workout {
  id: string;
  suggestion: string;
  created_at: string;
}

interface WorkoutRequest {
  goal: string;
  equipment: string;
  time: number;
}

interface WorkoutToSave {
  suggestion: string;
}

interface UserProfile {
  height?: number;
  weight?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  workout_level?: 'Beginner' | 'Intermediate' | 'Advanced';
}
