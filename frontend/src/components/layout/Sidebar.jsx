import { Link, useLocation } from 'react-router-dom';
import { useTasks } from '../../hooks/useTasks';
import { useExams } from '../../hooks/useExams';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import NotificationCenter from './NotificationCenter';

import {
  LogOut, X,
  LayoutDashboard, GraduationCap, MessageSquare, Upload,
  CheckSquare, Target, BarChart2, PlusCircle, Settings,
  User as UserIcon,
} from 'lucide-react';
import { daysUntil } from '../../utils/dates';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: tasks = [] } = useTasks();
  const { data: exams = [] } = useExams();

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error('Logout failed:', err); }
  };

  const name = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student';
  const course = profile?.course || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const activeTasks = tasks.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s !== 'done';
  });
  const upcomingExams = exams.filter(e => {
    const d = daysUntil(e.exam_date);
    return d !== null && d >= 0;
  });

  const navItems = [
    { section: 'Workspace' },
    { name: 'Dashboard',        path: '/',        icon: LayoutDashboard },
    { name: 'Exams',            path: '/exams',   icon: GraduationCap, badge: upcomingExams.length || null },
    { name: 'AI Chat',          path: '/chat',    icon: MessageSquare },
    { name: 'Upload Timetable', path: '/upload',  icon: Upload },
    { divider: true },
    { section: 'Planning' },
    { name: 'All Tasks',   path: '/tasks',     icon: CheckSquare, badge: activeTasks.length || null },
    { name: 'Focus Plan',  path: '/focus',     icon: Target },
    { name: 'Analytics',   path: '/analytics', icon: BarChart2 },
    { divider: true },
    { section: 'Add New' },
    { name: 'Add Task / Exam', path: '/add', icon: PlusCircle },
    { divider: true },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-[240px] md:w-[220px] md:min-w-[220px] bg-white border-r border-border flex flex-col p-0 h-full transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative`}>
      {/* Logo */}
      <div className="flex flex-col items-center px-4 pt-6 pb-5 border-b border-border">
        <div className="shrink-0 mb-2">
          <img src="/logo.png" alt="Trackit Logo" className="w-[140px] h-auto object-contain mix-blend-multiply" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.1em] text-primary uppercase bg-primary-light px-2 py-0.5 rounded-full">Pro Edition</span>
          <div className="ml-auto flex items-center gap-1">
            <NotificationCenter />
            <button onClick={onClose} className="md:hidden p-1 text-text-3 border-none bg-transparent">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 pb-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="text-[10px] font-semibold text-text-3 tracking-[0.08em] uppercase px-2 mb-1 mt-3 first:mt-0">
                {item.section}
              </div>
            );
          }
          if (item.divider) {
            return <div key={i} className="h-px bg-border mx-3 my-2" />;
          }

          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-[9px] px-2.5 py-2 rounded-rs cursor-pointer transition-all duration-150 text-[13.5px] font-medium mb-[1px] no-underline border border-transparent ${isActive ? 'bg-primary-light text-primary' : 'text-text-2 hover:bg-bg hover:text-text-1'}`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-primary' : 'text-text-3'}`} />
              {item.name}
              {item.badge ? (
                <span className="ml-auto text-[10px] font-semibold bg-primary text-white rounded-[10px] px-1.5 py-[1px] min-w-[18px] text-center">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User Footer - Premium Redesign */}
      <div className="mt-auto border-t border-border bg-white pt-2">
        <div className="px-3 pb-3">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-[10px] p-2.5 rounded-rs no-underline hover:bg-bg transition-all duration-200 group"
          >
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name} 
                  className="w-9 h-9 rounded-full object-cover border border-border shadow-sm group-hover:border-primary-mid transition-colors"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center text-[12px] font-bold border border-border">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-text-1 truncate group-hover:text-primary transition-colors">
                {name}
              </div>
              <div className="text-[11px] text-text-3 truncate font-medium">
                {course || 'Set up profile'}
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 rounded-rs text-text-3 hover:text-red-500 hover:bg-red-50 transition-all duration-200 border-none bg-transparent cursor-pointer group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[12px] font-semibold">Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
