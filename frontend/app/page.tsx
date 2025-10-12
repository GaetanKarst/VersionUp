'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    if (!user) {
      setError('You must be logged in to connect with Strava.');
      return;
    }
    try {
      // TODO: Replace with production API endpoint
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
    <div className="relative min-h-screen">
      {user && (
        <div className="absolute top-4 right-4">
          <Link href="/profile" className="text-gray-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Link>
        </div>
      )}
      <div className="text-center pt-20">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Version Yourself Up
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Sync your Strava data and get personalized workout recommendations to achieve your goals.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          {user ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Connecting...' : 'Connect with Strava!'}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get Started
            </Link>
          )}
        </div>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
