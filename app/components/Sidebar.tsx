'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
  const categories = [
    { name: 'All Documents', icon: '/file.svg', href: '/' },
    { name: 'Recent', icon: '/file.svg', href: '/recent' },
    { name: 'Shared', icon: '/globe.svg', href: '/shared' },
    { name: 'Google Drive', icon: '/window.svg', href: '/drive' },
  ];

  return (
    <aside className="w-64 bg-slate-100 dark:bg-slate-900 h-[calc(100vh-64px)] p-4 border-r border-slate-200 dark:border-slate-800">
      <div className="mb-8">
        <Link href="/upload" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <span className="text-lg">+</span>
          <span>Upload Document</span>
        </Link>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.name}>
              <Link 
                href={category.href}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Image src={category.icon} alt="" width={20} height={20} />
                <span>{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
            Receipts
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
            Contracts
          </span>
          <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs rounded-full">
            Bills
          </span>
        </div>
      </div>
    </aside>
  );
}