'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface SidebarProps {
  onCloseSidebar?: () => void;
}

export default function Sidebar({ onCloseSidebar }: SidebarProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  const categories = [
    { name: 'All Documents', icon: '/file.svg', href: '/' },
    { name: 'Recent', icon: '/file.svg', href: '/recent' },
    { name: 'Shared', icon: '/globe.svg', href: '/shared' },
    { name: 'Google Drive', icon: '/window.svg', href: '/drive' },
  ];

  const tags = [
    { name: 'Receipts', color: 'blue' },
    { name: 'Contracts', color: 'green' },
    { name: 'Bills', color: 'amber' },
    { name: 'Medical', color: 'rose' }
  ];

  return (
    <aside className="bg-[--card] h-full p-4 border-r border-[--border] shadow-sm">
      {/* Close button - mobile only */}
      {onCloseSidebar && (
        <button 
          onClick={onCloseSidebar}
          className="md:hidden flex ml-auto p-1 mb-2 rounded-full hover:bg-[--border] transition-colors"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      <div className="mb-8 scale-in">
        <Link 
          href="/upload" 
          className="btn btn-primary w-full flex items-center justify-center gap-2 group"
          onClick={onCloseSidebar}
        >
          <span className="text-lg group-hover:rotate-90 transition-transform duration-300">+</span>
          <span>Upload Document</span>
        </Link>
      </div>
      
      <nav className="mb-8">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[--secondary] mb-3 pl-2">Categories</h3>
        <ul className="space-y-1">
          {categories.map((category) => (
            <li key={category.name} className="slide-in" style={{ animationDelay: `${categories.indexOf(category) * 50}ms` }}>
              <Link 
                href={category.href}
                className={`
                  flex items-center gap-3 p-2 rounded-md transition-all duration-200
                  hover:bg-[--primary]/10 hover:translate-x-1
                  ${hoveredCategory === category.name ? 'bg-[--primary]/10' : ''}
                `}
                onClick={onCloseSidebar}
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className={`
                  w-8 h-8 flex items-center justify-center rounded-md
                  ${hoveredCategory === category.name ? 'bg-[--primary]/20' : 'bg-[--border]'}
                  transition-colors duration-200
                `}>
                  <Image src={category.icon} alt="" width={18} height={18} />
                </div>
                <span className="font-medium">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="pt-4 border-t border-[--border] fade-in">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[--secondary] mb-3 pl-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button 
              key={tag.name}
              className={`tag bg-${tag.color}-100 text-${tag.color}-800 dark:bg-${tag.color}-900 dark:text-${tag.color}-200 hover:scale-105 transition-transform`}
            >
              <span className={`w-2 h-2 rounded-full bg-${tag.color}-500`}></span>
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}