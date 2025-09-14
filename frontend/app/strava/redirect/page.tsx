'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';

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
      const exchangeToken = async () => {
        try {
          await axios.get(`http://localhost:8000/exchange_token?code=${code}`);
          setStatus('Authentication successful! Redirecting to your activities...');
          router.push('/activities');
        } catch (err) {
          const errorMessage = axios.isAxiosError(err) && err.response?.data?.detail 
            ? err.response.data.detail 
            : (err instanceof Error ? err.message : 'An unknown error occurred.');
          setError(errorMessage);
          setStatus('Authentication Failed.');
        }
      };
      exchangeToken();
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
