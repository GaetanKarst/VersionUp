'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading profile...</div>;
  }

  if (!user) {
    // This state is briefly visible before the redirect happens
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400">Email</p>
            <p className="text-lg">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </main>
  );
}

