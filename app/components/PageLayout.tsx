"use client"

import { ReactNode, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar with responsive behavior */}
        <div 
          className={`
            fixed md:relative z-30 md:z-auto w-[280px] md:w-64 
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            h-[calc(100vh-64px)] overflow-y-auto
          `}
        >
          <Sidebar onCloseSidebar={() => setSidebarOpen(false)} />
        </div>
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full md:w-auto slide-in">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}