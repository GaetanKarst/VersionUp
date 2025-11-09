'use client';

import { auth } from '@/lib/firebase';
import { useState, FormEvent, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function SuggestWorkoutPage() {
  const [goal, setGoal] = useState('Build Endurance');
  const [user, setUser] = useState<User | null>(null);
  const [equipment, setEquipment] = useState('');
  const [time, setTime] = useState(45);
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isStravaConnected, setIsStravaConnected] = useState(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to get a suggestion.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuggestion('');

    if (!user) {
      setError('You must be logged in to get a suggestion.');
      setIsLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/ai/suggest_workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ goal, equipment, time }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get suggestion.');
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkout = async () => {
    if (!user) {
      setError('You must be logged in to save a workout.');
      return;
    }

    if (window.confirm('Do you want to save this workout?')) {
      setIsLoading(true);
      setError('');
      try {
        const token = await user.getIdToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/v1/save_workout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ suggestion: suggestion }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to save workout.');
        }

        alert('Workout saved successfully!');
        setSuggestion('');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGiveFeedback = () => {
    const feedback = prompt('What would you like to modify about this suggestion?');
    if (feedback) {
      alert(`Thank you for your feedback: "${feedback}". We'll use this to improve!`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/api/v1/strava/status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setIsStravaConnected(data.is_connected);
          }
        } catch (error) {
          console.error("Failed to fetch Strava connection status:", error);
          setIsStravaConnected(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Get a Workout Suggestion</h1>
        <p className="text-slate-400 mb-8">
          Tell us your goals and we'll generate a personalized workout for you.
        </p>

        {!isStravaConnected && (
          <div className="bg-blue-900/50 border border-blue-700 text-blue-200 px-4 py-3 rounded-md relative mb-6" role="alert">
            <strong className="font-bold">Tip: </strong>
            <span className="block sm:inline">Connect your Strava account for suggestions tailored to your recent activities!</span>
          </div>
        )}

        {!suggestion && !isLoading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-slate-300 mb-2">
                Primary Goal
              </label>
              <select
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option>Build Endurance</option>
                <option>Build Muscle</option>
                <option>Lose Weight</option>
                <option>Improve Flexibility</option>
              </select>
            </div>

            <div>
              <label htmlFor="equipment" className="block text-sm font-medium text-slate-300 mb-2">
                Available Equipment
              </label>
              <input
                type="text"
                id="equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g., Dumbbells, resistance bands, treadmill"
                className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-slate-300 mb-2">
                Time Available (minutes)
              </label>
              <input
                type="number"
                id="time"
                value={time}
                onChange={(e) => setTime(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Suggest Workout'}
            </button>
          </form>
        )}

        {isLoading && <p className="text-center text-slate-400">Generating your workout...</p>}

        {error && <p className="text-center text-red-500">{error}</p>}

        {suggestion && (
          <div className="bg-slate-800 p-6 rounded-lg mt-8 whitespace-pre-wrap font-mono">
            <h2 className="text-2xl font-bold mb-4">Your Personalized Workout</h2>
            <p>{suggestion}</p>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={handleSaveWorkout}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center"
              >
                👍 Save Workout
              </button>
              <button
                onClick={handleGiveFeedback}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center"
              >
                👎 Modify Suggestion
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}