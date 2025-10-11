'use client';

import { useState, FormEvent } from 'react';

export default function SuggestWorkoutPage() {
  const [goal, setGoal] = useState('Build Endurance');
  const [equipment, setEquipment] = useState('');
  const [time, setTime] = useState(45);
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuggestion('');

    try {
      // TODO: Replace with production API endpoint URL
      const response = await fetch('http://localhost:8000/suggest_workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Get a Workout Suggestion</h1>
        <p className="text-slate-400 mb-8">
          Tell us your goals and we'll generate a personalized workout for you.
        </p>

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
          </div>
        )}
      </div>
    </main>
  );
}