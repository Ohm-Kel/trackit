import { useState, useEffect, useRef } from 'react';
import { User, Bell, Palette, Database, ChevronRight, Check, Save, Loader2, Sun, Moon, Monitor, Download, Trash2, Shield, LogOut, Globe, ExternalLink, Mail, BellOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTasks } from '../hooks/useTasks';
import { useExams } from '../hooks/useExams';
import { requestNotificationPermission } from '../components/NotificationManager';
import { useToast } from '../components/Toast';
import { exportTasksCSV, exportExamsCSV } from '../utils/export';

const PROFILE_KEY = 'trackit_profile';
const NOTIF_KEY = 'trackit_notif';

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-white border border-border rounded-r shadow-xs overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-primary-light flex items-center justify-center text-primary shrink-0">
          <Icon className="w-[16px] h-[16px]" />
        </div>
        <div>
          <div className="text-[14px] font-bold text-text-1">{title}</div>
          {description && <div className="text-[12px] text-text-3 mt-[1px]">{description}</div>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <div className="flex-1">
        <div className="text-[13.5px] font-semibold text-text-1">{label}</div>
        {description && <div className="text-[12px] text-text-3 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 border-none cursor-pointer shrink-0 mt-0.5 ${checked ? 'bg-primary' : 'bg-border2'}`}
        aria-label={label}
      >
        <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme, accent, setAccent, ACCENTS } = useTheme();
  const { user } = useAuth();
  const { data: allTasks = [] } = useTasks();
  const { data: allExams = [] } = useExams();
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!showExport) return;
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExport]);
  const { addToast } = useToast();
  const [profile, setProfile] = useState({
    name: '', university: '', course: '', year: '', email: '', avatar_url: ''
  });
  const [notif, setNotif] = useState({
    browser: false, deadlineReminder: true, weeklyDigest: false, focusPlanAlert: true
  });
  const [saved, setSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    // Load notifications from localStorage (still local preference)
    const n = localStorage.getItem(NOTIF_KEY);
    if (n) setNotif(JSON.parse(n));

    // Load profile from Supabase if user is logged in
    async function loadProfile() {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('display_name, email, avatar_url, university, course, year')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            name: data.display_name || '',
            email: data.email || '',
            avatar_url: data.avatar_url || '',
            university: data.university || '',
            course: data.course || '',
            year: data.year || ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: profile.name,
          email: profile.email,
          university: profile.university,
          course: profile.course,
          year: profile.year
        })
        .eq('id', user.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function updateNotif(key, value) {
    // If enabling browser notifications, request permission first
    if (key === 'browser' && value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        addToast('Browser notifications were denied. Please enable them in your browser settings.', { type: 'warning', title: 'Permission Denied' });
        return; // Don't toggle on if permission denied
      }
      addToast('Browser notifications enabled! You\'ll get alerts for upcoming deadlines.', { type: 'success', title: 'Notifications On' });
    }

    const updated = { ...notif, [key]: value };
    setNotif(updated);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  }

  const inputClass = "w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3";

  const navLinks = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ];

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">Settings</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">Manage your profile, preferences, and notification settings</p>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-9">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">

          {/* Side Nav */}
          <div className="bg-white border border-border rounded-r shadow-xs h-fit md:sticky md:top-4">
            {navLinks.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-[13px] font-semibold border-none cursor-pointer transition-all text-left border-b border-border last:border-b-0 ${activeSection === id ? 'bg-primary-light text-primary' : 'bg-transparent text-text-2 hover:bg-bg'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </div>
                {activeSection === id && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {/* Content Panels */}
          <div>

            {/* Profile */}
            {activeSection === 'profile' && (
              <Section icon={User} title="Profile" description="Your personal information displayed in the app">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.name} 
                      className="w-[52px] h-[52px] rounded-full object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-[52px] h-[52px] rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-[20px] shrink-0">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-[14px] font-bold text-text-1">{profile.name || 'Your Name'}</div>
                    <div className="text-[12px] text-text-3">{profile.email || 'Set your email below'}</div>
                  </div>
                </div>

                {loadingProfile ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Full Name</label>
                      <input type="text" className={inputClass} placeholder="e.g. Kwame Mensah" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Email Address</label>
                      <input type="email" disabled className={`${inputClass} opacity-60 cursor-not-allowed`} placeholder="you@university.edu" value={profile.email} />
                      <p className="text-[10px] text-text-3 mt-1 italic">Email is managed via your login provider</p>
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">University / Institution</label>
                      <input type="text" className={inputClass} placeholder="e.g. University of Ghana" value={profile.university} onChange={e => setProfile(p => ({ ...p, university: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Course / Program</label>
                      <input type="text" className={inputClass} placeholder="e.g. BSc Computer Science" value={profile.course} onChange={e => setProfile(p => ({ ...p, course: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Year / Level</label>
                      <select className={inputClass} value={profile.year} onChange={e => setProfile(p => ({ ...p, year: e.target.value }))}>
                        <option value="">Select year…</option>
                        <option>Year 1 / Freshman</option>
                        <option>Year 2 / Sophomore</option>
                        <option>Year 3 / Junior</option>
                        <option>Year 4 / Senior</option>
                        <option>Postgraduate / Masters</option>
                        <option>PhD</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-rs text-[13px] font-semibold border-none cursor-pointer shadow-xs transition-colors disabled:opacity-60"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Profile
                  </button>
                  {saved && (
                    <div className="flex items-center gap-1.5 text-[13px] text-[#16A34A] font-semibold animate-[fadeIn_0.2s_ease]">
                      <Check className="w-4 h-4" /> Saved!
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <Section icon={Bell} title="Notifications" description="Control how and when Trackit alerts you">
                <Toggle
                  label="Browser notifications"
                  description="Get desktop alerts for upcoming deadlines (requires browser permission)"
                  checked={notif.browser}
                  onChange={v => updateNotif('browser', v)}
                />
                <Toggle
                  label="Deadline reminders"
                  description="Get reminded 24 hours before a task is due"
                  checked={notif.deadlineReminder}
                  onChange={v => updateNotif('deadlineReminder', v)}
                />
                <Toggle
                  label="Weekly digest"
                  description="Receive a weekly summary of your progress and upcoming deadlines"
                  checked={notif.weeklyDigest}
                  onChange={v => updateNotif('weeklyDigest', v)}
                />
                <Toggle
                  label="Focus plan alerts"
                  description="Notify me when today's study plan is updated by AI"
                  checked={notif.focusPlanAlert}
                  onChange={v => updateNotif('focusPlanAlert', v)}
                />
                <div className="mt-4 p-3.5 bg-bg border border-border rounded-rs">
                  <div className="text-[12px] text-text-3 leading-relaxed">
                    💡 Notification settings are stored on this device. Browser notifications require your browser's permission — you'll be prompted when you enable them.
                    {typeof Notification !== 'undefined' && Notification.permission === 'granted' && (
                      <span className="block mt-1 text-[#16A34A] font-semibold">✓ Browser notification permission granted</span>
                    )}
                    {typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
                      <span className="block mt-1 text-[#EF4444] font-semibold">✗ Browser notifications blocked — update in browser settings</span>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <Section icon={Palette} title="Appearance" description="Customise how Trackit looks">
                <div className="mb-6">
                  <div className="text-[13px] font-semibold text-text-2 mb-3">Theme</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: Sun, previewBg: '#FFFFFF', previewBorder: '#E8ECF0', dotColor: 'var(--color-primary)', barColor: '#E8ECF0' },
                      { id: 'dark', label: 'Dark', icon: Moon, previewBg: '#161929', previewBorder: '#2A2F45', dotColor: '#818CF8', barColor: '#2A2F45' },
                      { id: 'system', label: 'System', icon: Monitor, previewBg: 'linear-gradient(135deg, #FFFFFF 50%, #161929 50%)', previewBorder: '#CCC', dotColor: '#94A3B8', barColor: '#CBD5E1' },
                    ].map(({ id, label, icon: Icon, previewBg, previewBorder, dotColor, barColor }) => {
                      const isActive = theme === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setTheme(id)}
                          className={`flex flex-col items-center gap-2.5 p-4 border-[1.5px] rounded-r cursor-pointer transition-all font-sans ${isActive ? 'border-primary bg-primary-faint' : 'border-border bg-white hover:border-primary-mid'}`}
                        >
                          <div
                            className="w-full h-[50px] rounded-[6px] flex items-center gap-2 px-3"
                            style={{ background: previewBg, border: `1px solid ${previewBorder}` }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }}></div>
                            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: barColor }}></div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-text-3" />
                            <span className="text-[12px] font-semibold text-text-2">{label}</span>
                          </div>
                          {isActive && <div className="text-[10px] text-primary font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Active</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[13px] font-semibold text-text-2 mb-3">Accent Colour</div>
                  <div className="flex gap-3 flex-wrap">
                    {Object.entries(ACCENTS).map(([key, colors]) => (
                      <button
                        key={key}
                        title={key.charAt(0).toUpperCase() + key.slice(1)}
                        onClick={() => setAccent(key)}
                        className={`w-9 h-9 rounded-full border-[2.5px] cursor-pointer transition-all hover:scale-110 flex items-center justify-center ${accent === key ? 'border-text-1 scale-110 shadow-sm' : 'border-transparent'}`}
                        style={{ backgroundColor: colors.primary }}
                      >
                        {accent === key && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2.5 text-[11.5px] text-text-3">Changes apply instantly across the entire app.</div>
                </div>
              </Section>
            )}

            {/* Data & Privacy */}
            {activeSection === 'data' && (
              <Section icon={Database} title="Data & Privacy" description="Manage your data stored by Trackit">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-bg border border-border rounded-r">
                    <div>
                      <div className="text-[13.5px] font-semibold text-text-1">Export all data</div>
                      <div className="text-[12px] text-text-3 mt-0.5">Download your profile, tasks, exams, and preferences as JSON</div>
                    </div>
                    <div className="relative" ref={exportRef}>
                    <button
                      onClick={() => setShowExport(!showExport)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border text-text-2 rounded-rs text-[12px] font-semibold cursor-pointer hover:border-primary hover:text-primary transition-all shadow-xs"
                    >
                      <Download className="w-3 h-3" />
                      Export Data
                    </button>
                    {showExport && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-rs shadow-md z-10 py-1 min-w-[180px]">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-text-3 uppercase tracking-wider border-b border-border mb-1">Backup</div>
                        <button
                          onClick={() => {
                            const data = { profile, tasks: allTasks, exams: allExams, notifications: JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'), exported_at: new Date().toISOString() };
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = 'trackit-full-data.json'; a.click();
                            URL.revokeObjectURL(url);
                            setShowExport(false);
                          }}
                          className="w-full text-left px-3 py-2 text-[12.5px] text-text-1 hover:bg-bg border-none bg-transparent cursor-pointer font-medium"
                        >
                          Full JSON Backup (.json)
                        </button>
                        <div className="px-3 py-1.5 text-[10px] font-bold text-text-3 uppercase tracking-wider border-b border-border my-1">Quick Export</div>
                        <button onClick={() => { exportTasksCSV(allTasks); setShowExport(false); }} className="w-full text-left px-3 py-2 text-[12.5px] text-text-1 hover:bg-bg border-none bg-transparent cursor-pointer font-medium">Tasks as CSV</button>
                        <button onClick={() => { exportExamsCSV(allExams); setShowExport(false); }} className="w-full text-left px-3 py-2 text-[12.5px] text-text-1 hover:bg-bg border-none bg-transparent cursor-pointer font-medium">Exams as CSV</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-bg border border-border rounded-r">
                    <div>
                      <div className="text-[13.5px] font-semibold text-text-1">Reset local preferences</div>
                      <div className="text-[12px] text-text-3 mt-0.5">Reset theme and notifications on this device. Your account data stays in the cloud.</div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Clear all local settings? This cannot be undone.')) {
                          localStorage.removeItem(PROFILE_KEY);
                          localStorage.removeItem(NOTIF_KEY);
                          setProfile({ name: '', university: '', course: '', year: '', email: '' });
                          setNotif({ browser: false, deadlineReminder: true, weeklyDigest: false, focusPlanAlert: true });
                        }
                      }}
                      className="px-3 py-1.5 bg-white border border-[#FCA5A5] text-[#EF4444] rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-[#FEF2F2] transition-all shrink-0 ml-3"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-primary-faint border border-primary-mid rounded-r">
                  <div className="text-[12px] font-bold text-primary mb-1.5">Where is my data?</div>
                  <div className="text-[12px] text-text-2 leading-relaxed">
                    Your profile, tasks, and exams are stored securely in a <strong>Supabase cloud database</strong> so they stay synced across all your devices. Only your theme and notification preferences are saved locally on your browser.
                  </div>
                </div>
              </Section>
            )}

            {/* Version */}
            <div className="text-center text-[11px] text-text-3 mt-6">
              Trackit v0.1.0 — BETA · Data Structures Student Edition
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
