'use client';

import { useState } from 'react';
import axios from 'axios';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/');
      if (response.data.authorization_url) {
        // Strava authentication redirection
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error('Authorization URL not found in response.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
        Version Yourself Up
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
        Sync your Strava data and get personalized workout recommendations to achieve your goals.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Connecting...' : 'Connect with Strava!'}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}
