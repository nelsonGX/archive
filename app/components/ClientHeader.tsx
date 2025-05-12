'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function ClientHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  return (
    <header className="bg-slate-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image src="/file.svg" alt="Archive Logo" width={24} height={24} />
          <span>Archive</span>
        </Link>
        <nav>
          {loading ? (
            <div className="h-8 w-24 animate-pulse bg-slate-700 rounded"></div>
          ) : (
            <ul className="flex gap-6 items-center">
              {user ? (
                <>
                  <li>
                    <Link href="/scan" className="hover:text-blue-300 transition-colors">
                      Scan
                    </Link>
                  </li>
                  <li>
                    <Link href="/upload" className="hover:text-blue-300 transition-colors">
                      Upload
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="hover:text-blue-300 transition-colors">
                      Settings
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center gap-2">
                      {user.image && (
                        <Image 
                          src={user.image} 
                          alt="Profile" 
                          width={32} 
                          height={32} 
                          className="rounded-full"
                        />
                      )}
                      <span className="hidden md:inline">{user.name}</span>
                    </div>
                  </li>
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/auth/signin" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/signup" className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition-colors">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
}