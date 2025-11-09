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
