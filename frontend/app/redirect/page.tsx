'use client';

import { useEffect, useState, Suspense } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold mb-4">Loading...</h1>
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function RedirectHandler() {
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

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/strava/exchange_token?code=${code}`, {
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

export default function StravaRedirectPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RedirectHandler />
    </Suspense>
  );
}
