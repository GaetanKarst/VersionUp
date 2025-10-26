'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await axios.get<StravaActivity[]>(`${apiUrl}/activities`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setActivities(response.data);
        } catch (err) {
          if (axios.isAxiosError(err)) {
            setError(err.response?.data?.detail || 'Failed to fetch activities.');
          } else {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // No user is signed in.
        setError('You must be logged in to view activities.');
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const formatDistance = (distanceInMeters: number) => {
    return `${(distanceInMeters / 1000).toFixed(2)} km`;
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };

  if (isLoading) {
    return <div className="text-center">Loading your activities...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Latest Strava Activities</h1>
      {activities.length > 0 ? (
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{activity.name}</h2>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-600 dark:text-gray-300">
                <span>{activity.type}</span>
                <span>{new Date(activity.start_date_local).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-start items-center mt-3 space-x-6">
                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="font-medium">{formatDistance(activity.distance)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Moving Time</p>
                  <p className="font-medium">{formatTime(activity.moving_time)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No activities found. Go out and do something!</p>
      )}
    </div>
  );
}