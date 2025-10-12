'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function StravaRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Authenticating with Strava...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication failed, access denied.');
      setStatus('Authentication Failed.');
      return;
    }

    if (code) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();

        if (user) {
          try {
            const idToken = await user.getIdToken();

            // TODO: Replace with production API endpoint URL when deploying
            const response = await fetch(`http://localhost:8000/exchange_token?code=${code}`, {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || 'Failed to exchange Strava token.');
            }

            setStatus('Authentication successful! Redirecting to your activities...');
            router.push('/activities');
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setStatus('Authentication Failed.');
          }
        } else {
          setError("You must be logged in to connect a Strava account.");
          setStatus('Authentication Failed.');
        }
      });
    } else {
        setStatus('Invalid redirection. No authorization code found.');
        setError('Could not find authorization code in the redirect URL.');
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold mb-4">{status}</h1>
      {error && <p className="text-red-500">{error}</p>}
      {!error && (
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      )}
    </div>
  );
}
