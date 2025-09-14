'use client';

import { useState, FormEvent } from 'react';

export default function SuggestPage() {
  const [goal, setGoal] = useState('Build Endurance');
  const [equipment, setEquipment] = useState('');
  const [time, setTime] = useState(45);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to the backend to get a workout suggestion
    console.log({ goal, equipment, time });
    setIsLoading(true);
    // Fake loading for now to show UI changes
    setTimeout(() => {
      setSuggestion('This is a placeholder for an AI-generated workout suggestion. Implement the backend endpoint and call it here.');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Get a Workout Suggestion</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Tell us your goals and we&apos;ll generate a personalized workout for you.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div>
          <label htmlFor="goal" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Primary Goal
          </label>
          <div className="mt-2">
            <select
              id="goal"
              name="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:bg-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              <option>Build Endurance</option>
              <option>Increase Strength</option>
              <option>Lose Weight</option>
              <option>Active Recovery</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="equipment" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Available Equipment
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="equipment"
              id="equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g., Dumbbells, resistance bands, treadmill"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:bg-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Time Available (minutes)
          </label>
          <div className="mt-2">
            <input
              type="number"
              name="time"
              id="time"
              value={time}
              onChange={(e) => setTime(parseInt(e.target.value, 10))}
              min="10"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:bg-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Generating...' : 'Suggest Workout'}
          </button>
        </div>
      </form>

      {suggestion && (
        <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">Your Workout Suggestion</h2>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            {suggestion}
          </p>
        </div>
      )}
    </div>
  );
}