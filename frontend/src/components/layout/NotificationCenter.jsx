import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Info, AlertTriangle, Sparkles, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function NotificationCenter() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      if (!session?.access_token) return;
      
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }

      // Proactively trigger AI suggestion analysis
      await fetch('/api/notifications/generate-suggestions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    if (session?.user?.id) {
      const channel = supabase
        .channel(`public:notifications:user_id=eq.${session.user.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: true } : n));
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success': return { icon: Check, color: 'text-green-500', bg: 'bg-green-50' };
      case 'warning': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'ai_suggestion': return { icon: Sparkles, color: 'text-primary', bg: 'bg-primary-light' };
      default: return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-bg transition-colors border-none bg-transparent cursor-pointer group"
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-primary fill-primary/10' : 'text-text-3 group-hover:text-text-2'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-border z-[100] animate-[fadeIn_0.2s_ease]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-[14px] font-bold text-text-1">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-primary hover:text-primary-hover border-none bg-transparent cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-text-4" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-text-4" />
                </div>
                <p className="text-[13px] font-medium text-text-3">No notifications yet</p>
                <p className="text-[11px] text-text-4 mt-1">We'll alert you here when stuff happens</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => {
                  const { icon: Icon, color, bg } = getTypeStyles(n.type);
                  return (
                    <div 
                      key={n.id} 
                      className={`p-4 flex gap-3 transition-colors ${n.read_status ? 'bg-white opacity-70' : 'bg-primary-light/10'}`}
                      onClick={() => !n.read_status && markAsRead(n.id)}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] leading-snug ${n.read_status ? 'text-text-2 font-medium' : 'text-text-1 font-bold'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-text-4 mt-1.5 font-medium">
                          {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.read_status && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-border bg-bg/30 text-center">
            <button className="text-[11px] font-bold text-text-3 hover:text-text-1 border-none bg-transparent cursor-pointer py-1.5 w-full">
              View All History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
