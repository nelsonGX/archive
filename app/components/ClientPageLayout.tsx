'use client';

import { ReactNode, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';

// Dynamically import the ClientHeader to avoid SSR issues
const ClientHeader = dynamic(() => import('./ClientHeader'), {
  ssr: false,
  loading: () => <div className="h-16 bg-slate-800 animate-pulse"></div>
});

interface ClientPageLayoutProps {
  children: ReactNode;
}

export default function ClientPageLayout({ children }: ClientPageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <ClientHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}