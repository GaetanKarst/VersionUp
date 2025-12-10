'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import WheelPicker from '@/app/components/WheelPicker';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const heights = Array.from({ length: 151 }, (_, i) => 100 + i);
  const weights = Array.from({ length: (200 - 30) * 2 + 1 }, (_, i) => 30 + i * 0.5);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const token = await currentUser.getIdToken();
        
        try {
          const response = await fetch(`${API_URL}/api/v1/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setProfile(data || {});
          } else {
            console.error('Failed to fetch profile');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
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

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value ? value : undefined
    }));
  };

  const handleWheelChange = (name: 'height' | 'weight') => (value: string | number) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value
    }));
  };
  
  const handleProfileSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const token = await user.getIdToken();
    try {
      const response = await fetch(`${API_URL}/api/v1/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setIsEditing(false);
        console.log('Profile update successfully')
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading profile...</div>;
  }

  if (!user) {
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
          <form onSubmit={handleProfileSave}>
            <div className="space-y-4">
              <div>
                <label htmlFor="height" className="text-sm text-slate-400">Height (cm)</label>
                {isEditing ? (
                  <WheelPicker
                    items={heights}
                    onChange={handleWheelChange('height')}
                    value={profile.height}
                    height={120}
                    itemHeight={30}
                  />
                ) : (
                  <p className="text-lg h-[30px]">{profile.height ? `${profile.height} cm` : 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="weight" className="text-sm text-slate-400">Weight (kg)</label>
                {isEditing ? (
                  <WheelPicker
                    items={weights}
                    onChange={handleWheelChange('weight')}
                    value={profile.weight}
                    height={120}
                    itemHeight={30}
                  />
                ) : (
                  <p className="text-lg h-[30px]">{profile.weight ? `${profile.weight} kg` : 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="gender" className="text-sm text-slate-400">Gender</label>
                {isEditing ? (
                  <select
                    name="gender"
                    id="gender"
                    value={profile.gender || ''}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 mt-1"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-lg">{profile.gender || 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="workout_level" className="text-sm text-slate-400">Workout Level</label>
                 {isEditing ? (
                    <select
                      name="workout_level"
                      id="workout_level"
                      value={profile.workout_level || ''}
                      onChange={handleProfileChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 mt-1"
                    >
                      <option value="">Select your level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                ) : (
                  <p className="text-lg">{profile.workout_level || 'Not set'}</p>
                )}
              </div>
            </div>
            {isEditing && (
              <button
                type="submit"
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
              >
                Save Profile
              </button>
            )}
          </form>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Edit Profile
            </button>
          )}
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

