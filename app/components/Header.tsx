'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-[--card] border-b border-[--border] shadow-sm h-16 flex items-center px-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-[--border] transition-colors mr-2"
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl transition-transform hover:scale-105">
          <div className="bg-[--primary] p-1.5 rounded-md">
            <Image src="/file.svg" alt="Archive Logo" width={20} height={20} className="invert" />
          </div>
          <span className="hidden sm:inline bounce">Archive</span>
        </Link>

        {/* Desktop navigation */}
        {user && (
          <nav className="hidden md:block">
            <ul className="flex gap-6 items-center">
              <li>
                <Link href="/scan" className="p-2 rounded-md hover:bg-[--border] transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 8v.5A2.5 2.5 0 0 1 12.5 11h-1A2.5 2.5 0 0 0 9 13.5V16"></path>
                    <rect width="16" height="16" x="4" y="4" rx="2"></rect>
                  </svg>
                  <span>Scan</span>
                </Link>
              </li>
              <li>
                <Link href="/upload" className="p-2 rounded-md hover:bg-[--border] transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" x2="12" y1="3" y2="15"></line>
                  </svg>
                  <span>Upload</span>
                </Link>
              </li>
              <li>
                <Link href="/settings" className="p-2 rounded-md hover:bg-[--border] transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
        )}

        {/* User Account */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[--border] transition-colors"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-[--primary]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[--primary] flex items-center justify-center text-white">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden md:inline font-medium">{user.name}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-[--card] rounded-md shadow-lg border border-[--border] z-10 scale-in">
                  {/* Mobile-only navigation links */}
                  <div className="md:hidden border-b border-[--border] pb-2 mb-2">
                    <Link 
                      href="/scan" 
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[--border] transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 8v.5A2.5 2.5 0 0 1 12.5 11h-1A2.5 2.5 0 0 0 9 13.5V16"></path>
                        <rect width="16" height="16" x="4" y="4" rx="2"></rect>
                      </svg>
                      Scan
                    </Link>
                    <Link 
                      href="/upload" 
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[--border] transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" x2="12" y1="3" y2="15"></line>
                      </svg>
                      Upload
                    </Link>
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[--border] transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      Settings
                    </Link>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 px-4 py-2 hover:bg-[--border] transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 px-4 py-2 w-full text-left text-[--error] hover:bg-[--border] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" x2="9" y1="12" y2="12"></line>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin" className="btn btn-primary px-3 py-1.5 text-sm slide-in">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn btn-secondary px-3 py-1.5 text-sm hidden sm:inline-block slide-in" style={{ animationDelay: '100ms' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}