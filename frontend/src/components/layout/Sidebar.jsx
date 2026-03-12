import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, MessageSquare, Upload, CheckSquare, Target, BarChart2, PlusCircle, Settings, X } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useExams } from '../../hooks/useExams';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { data: tasks = [] } = useTasks();
  const { data: exams = [] } = useExams();

  const profile = JSON.parse(localStorage.getItem('trackit_profile') || '{}');
  const name = profile.name || 'Student';
  const course = profile.course || 'Add your course →';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const activeTasks = tasks.filter(t => {
    const s = (t.status || '').toLowerCase();
    return !s.includes('done') && !s.includes('complet');
  });
  const upcomingExams = exams.filter(e => {
    if (!e.exam_date) return false;
    const diff = Math.ceil((new Date(e.exam_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
    return diff >= 0;
  });

  const navItems = [
    { section: 'Workspace' },
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Exams', path: '/exams', icon: GraduationCap, badge: upcomingExams.length || null },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Upload Timetable', path: '/upload', icon: Upload },
    { divider: true },
    { section: 'Planning' },
    { name: 'All Tasks', path: '/tasks', icon: CheckSquare, badge: activeTasks.length || null },
    { name: 'Focus Plan', path: '/focus', icon: Target },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { divider: true },
    { section: 'Add New' },
    { name: 'Add Task / Exam', path: '/add', icon: PlusCircle },
    { divider: true },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-[240px] md:w-[220px] md:min-w-[220px] bg-white border-r border-border flex flex-col p-0 h-full transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative`}>
      <div className="flex items-center gap-2.5 px-5 pt-5.5 pb-5 border-b border-border">
        <div className="w-[30px] h-[30px] bg-primary rounded-lg flex items-center justify-center shrink-0">
          <svg viewBox="0 0 16 16" className="w-[15px] h-[15px] fill-white"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"/></svg>
        </div>
        <span className="text-base font-bold text-text-1 tracking-[-0.3px]">Trackit</span>
        <span className="text-[9px] font-semibold tracking-[0.05em] bg-primary-light text-primary rounded px-1.5 py-0.5 ml-0.5">BETA</span>
        <button onClick={onClose} className="md:hidden ml-auto p-1 text-text-3 border-none bg-transparent">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 pb-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="text-[10px] font-semibold text-text-3 tracking-[0.08em] uppercase px-2 mb-1 mt-3 first:mt-0">{item.section}</div>;
          }
          if (item.divider) {
            return <div key={i} className="h-px bg-border mx-3 my-2"></div>;
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
                <span className="ml-auto text-[10px] font-semibold bg-primary text-white rounded-[10px] px-1.5 py-[1px] min-w-[18px] text-center">{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <Link
        to="/settings"
        onClick={onClose}
        className="p-3 pb-4 border-t border-border no-underline block hover:bg-bg transition-colors"
      >
        <div className="flex items-center gap-[9px] px-2.5 py-2 rounded-rs">
          <div className="w-7 h-7 rounded-full bg-primary-light text-primary flex items-center justify-center text-[11px] font-bold shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-text-1 truncate">{name}</div>
            <div className="text-[11px] text-text-3 truncate max-w-[130px]">{course}</div>
          </div>
        </div>
      </Link>
    </aside>
  );
}
