import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationManager from '../NotificationManager';
import OnboardingTour from '../OnboardingTour';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg overflow-hidden text-[14px] font-sans antialiased">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-[60px] bg-white border-b border-border flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 16 16" className="w-[13px] h-[13px] fill-white"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"/></svg>
          </div>
          <span className="text-[15px] font-bold text-text-1 tracking-[-0.3px]">Trackit</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="p-2 -mr-2 text-text-2 bg-transparent border-none">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar pt-[60px] md:pt-0">
        <Outlet />
      </main>

      <NotificationManager />
      <OnboardingTour />
    </div>
  );
}
