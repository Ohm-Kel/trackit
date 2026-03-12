import { useState, useEffect } from 'react';
import { User, Bell, Palette, Database, ChevronRight, Check, Save, Loader2 } from 'lucide-react';

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
  const [profile, setProfile] = useState({
    name: '', university: '', course: '', year: '', email: ''
  });
  const [notif, setNotif] = useState({
    browser: false, deadlineReminder: true, weeklyDigest: false, focusPlanAlert: true
  });
  const [saved, setSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    const p = localStorage.getItem(PROFILE_KEY);
    const n = localStorage.getItem(NOTIF_KEY);
    if (p) setProfile(JSON.parse(p));
    if (n) setNotif(JSON.parse(n));
  }, []);

  function saveProfile() {
    setSavingProfile(true);
    setTimeout(() => {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setSavingProfile(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 400);
  }

  function updateNotif(key, value) {
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
                  <div className="w-[52px] h-[52px] rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-[20px] shrink-0">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-text-1">{profile.name || 'Your Name'}</div>
                    <div className="text-[12px] text-text-3">{profile.email || 'Set your email below'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Full Name</label>
                    <input type="text" className={inputClass} placeholder="e.g. Kwame Mensah" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Email Address</label>
                    <input type="email" className={inputClass} placeholder="you@university.edu" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">University / Institution</label>
                    <input type="text" className={inputClass} placeholder="e.g. University of Ghana" value={profile.university} onChange={e => setProfile(p => ({ ...p, university: e.target.value }))} />
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
                    💡 Notification settings are stored on this device. Enabling browser notifications will trigger a browser permission prompt the next time you visit.
                  </div>
                </div>
              </Section>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <Section icon={Palette} title="Appearance" description="Customise how Trackit looks">
                <div className="mb-5">
                  <div className="text-[13px] font-semibold text-text-2 mb-3">Theme</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', preview: 'bg-white border border-border', dot: 'bg-primary' },
                      { id: 'dark', label: 'Dark (Coming Soon)', preview: 'bg-[#1E1E2E] border border-[#333]', dot: 'bg-[#6C6EF7]', disabled: true },
                      { id: 'auto', label: 'System (Coming Soon)', preview: 'bg-gradient-to-br from-white to-[#1E1E2E] border border-border', dot: 'bg-text-3', disabled: true },
                    ].map(({ id, label, preview, dot, disabled }) => (
                      <button
                        key={id}
                        disabled={disabled}
                        className={`flex flex-col items-center gap-2 p-4 border-[1.5px] rounded-r cursor-pointer transition-all font-sans ${id === 'light' ? 'border-primary bg-primary-faint' : 'border-border bg-white'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary'}`}
                      >
                        <div className={`w-full h-[50px] rounded-[6px] ${preview} flex items-center gap-2 px-3`}>
                          <div className={`w-2 h-2 rounded-full ${dot}`}></div>
                          <div className="flex-1 h-1.5 bg-border rounded-full"></div>
                        </div>
                        <div className="text-[12px] font-semibold text-text-2 text-center">{label}</div>
                        {id === 'light' && <div className="text-[10px] text-primary font-bold">Active</div>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[13px] font-semibold text-text-2 mb-3">Accent Colour</div>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { color: '#5B6EF7', label: 'Indigo (Default)', active: true },
                      { color: '#8B5CF6', label: 'Purple', active: false },
                      { color: '#0EA5E9', label: 'Blue', active: false },
                      { color: '#10B981', label: 'Emerald', active: false },
                    ].map(({ color, label, active }) => (
                      <button
                        key={color}
                        title={label}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${active ? 'border-text-1 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 text-[11.5px] text-text-3">Custom colour theming coming soon.</div>
                </div>
              </Section>
            )}

            {/* Data & Privacy */}
            {activeSection === 'data' && (
              <Section icon={Database} title="Data & Privacy" description="Manage your data stored by Trackit">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-bg border border-border rounded-r">
                    <div>
                      <div className="text-[13.5px] font-semibold text-text-1">Export your data</div>
                      <div className="text-[12px] text-text-3 mt-0.5">Download all your tasks, exams, and settings as JSON</div>
                    </div>
                    <button
                      onClick={() => {
                        const data = {
                          profile: JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'),
                          notifications: JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'),
                          exported_at: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'trackit-data.json'; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1.5 bg-white border border-border2 text-text-2 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all shrink-0 ml-3"
                    >
                      Export
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-bg border border-border rounded-r">
                    <div>
                      <div className="text-[13.5px] font-semibold text-text-1">Clear local settings</div>
                      <div className="text-[12px] text-text-3 mt-0.5">Remove your profile and preferences stored on this device</div>
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
                  <div className="text-[12px] font-bold text-primary mb-1.5">About your data</div>
                  <div className="text-[12px] text-text-2 leading-relaxed">
                    Your tasks and exams are stored in a secure Supabase database. Profile settings are stored in your browser's localStorage only and not transmitted to any server.
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
