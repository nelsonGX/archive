import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/app/auth';
import { signOutAction } from '@/app/actions/auth';

export default async function Header() {
  const session = await auth();
  const user = session?.user;
  
  return (
    <header className="bg-slate-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image src="/file.svg" alt="Archive Logo" width={24} height={24} />
          <span>Archive</span>
        </Link>
        <nav>
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
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
                    >
                      Sign Out
                    </button>
                  </form>
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
        </nav>
      </div>
    </header>
  );
}