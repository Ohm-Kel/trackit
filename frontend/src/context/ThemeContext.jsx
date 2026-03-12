import { createContext, useContext, useState, useEffect } from 'react';

const THEME_KEY = 'trackit_theme';
const ACCENT_KEY = 'trackit_accent';

const ACCENTS = {
  indigo:  { primary: '#4F46E5', hover: '#4338CA', light: '#EEF2FF', mid: '#C7D2FE', faint: '#F5F3FF' },
  purple:  { primary: '#8B5CF6', hover: '#7C3AED', light: '#F3F0FF', mid: '#DDD6FE', faint: '#FAF5FF' },
  blue:    { primary: '#0EA5E9', hover: '#0284C7', light: '#E0F2FE', mid: '#BAE6FD', faint: '#F0F9FF' },
  emerald: { primary: '#10B981', hover: '#059669', light: '#ECFDF5', mid: '#A7F3D0', faint: '#F0FDF4' },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'light';
  });
  const [accent, setAccentState] = useState(() => {
    return localStorage.getItem(ACCENT_KEY) || 'indigo';
  });

  function setTheme(t) {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
  }

  function setAccent(a) {
    setAccentState(a);
    localStorage.setItem(ACCENT_KEY, a);
  }

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Resolve effective theme (light, dark, or system)
    let effective = theme;
    if (theme === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', effective);

    // Listen for system changes when 'system' is selected
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  // Apply accent colours
  useEffect(() => {
    const root = document.documentElement;
    const colors = ACCENTS[accent] || ACCENTS.indigo;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.hover);
    root.style.setProperty('--color-primary-light', colors.light);
    root.style.setProperty('--color-primary-mid', colors.mid);
    root.style.setProperty('--color-primary-faint', colors.faint);
  }, [accent]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent, ACCENTS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
