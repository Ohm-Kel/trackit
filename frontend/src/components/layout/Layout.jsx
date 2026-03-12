import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden text-[14px] font-sans antialiased">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <Outlet />
      </main>
    </div>
  );
}
