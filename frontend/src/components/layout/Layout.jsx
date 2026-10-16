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
          {/* The clock mark from the sidebar logo, so phone and desktop match. */}
          <img src="/logo-mark.png" alt="" className="w-[28px] h-[28px] mix-blend-multiply" />
          <span className="text-[15px] font-bold text-text-1 tracking-[-0.3px]">Trackit</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="w-[44px] h-[44px] -mr-[10px] flex items-center justify-center text-text-2 bg-transparent border-none">
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
