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
  const [latestWorkout, setLatestWorkout] = useState<Workout | null>(null);
  const [isWorkoutsLoading, setIsWorkoutsLoading] = useState(false);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch saved workouts
        setIsWorkoutsLoading(true);
        setWorkoutsError(null);
        try {
          const token = await currentUser.getIdToken();
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/get_latest_workout`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch saved workouts.');
          }

          const data = await response.json();
          setLatestWorkout(data.length > 0 ? data[0] : null);
        } catch (err: any) {
          setWorkoutsError(err.message);
        } finally {
          setIsWorkoutsLoading(false);
        }
      } else {
        setLatestWorkout(null);
      }
    });

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/`);
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

  const handleViewWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
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
        {user && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-white mb-4">Your Latest Workout</h2>
            {isWorkoutsLoading && <p className="text-center text-slate-400">Loading your workout...</p>}
            {workoutsError && <p className="text-center text-red-500">{workoutsError}</p>}
            {!latestWorkout && !isWorkoutsLoading && !workoutsError && (
              <p className="text-center text-slate-400">No saved workouts yet. Go to <Link href="/suggest" className="text-blue-400 hover:underline">Suggest Workout</Link> to create one!</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestWorkout && (
                <div key={latestWorkout.id} className="bg-slate-800 p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold text-white mb-2">Workout Plan</h3>
                  <p className="text-slate-300 whitespace-pre-wrap text-sm">{latestWorkout.suggestion.substring(0, 200)}...</p> {/* Display a snippet */}
                  <p className="text-slate-500 text-xs mt-2">Saved on: {new Date(latestWorkout.created_at._seconds * 1000).toLocaleDateString()}</p>
                  <button
                    onClick={() => handleViewWorkout(latestWorkout)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    View Full Workout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {isModalOpen && selectedWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Full Workout Plan</h2>
            <p className="text-slate-300 whitespace-pre-wrap text-sm">{selectedWorkout.suggestion}</p>
            <button
              onClick={closeModal}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}