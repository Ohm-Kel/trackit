import { useEffect, useRef } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useExams } from '../hooks/useExams';
import { daysUntil } from '../utils/dates';
import { useToast } from './Toast';

const NOTIF_KEY = 'trackit_notif';
const LAST_CHECK_KEY = 'trackit_notif_last_check';
const CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

function getPrefs() {
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { browser: false, deadlineReminder: true, weeklyDigest: false, focusPlanAlert: true };
}

function shouldCheck() {
  const last = localStorage.getItem(LAST_CHECK_KEY);
  if (!last) return true;
  return Date.now() - Number(last) > CHECK_INTERVAL;
}

function markChecked() {
  localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
}

/**
 * Request browser notification permission.
 * Returns true if granted.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Show a native browser notification (if permitted).
 */
function showBrowserNotification(title, body, onClick) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: title, // prevent duplicate notifications with same title
  });
  if (onClick) n.onclick = onClick;
}

/**
 * NotificationManager runs at the app level.
 * It checks for upcoming deadlines and shows notifications.
 */
export default function NotificationManager() {
  const { data: tasks = [] } = useTasks();
  const { data: exams = [] } = useExams();
  const { addToast } = useToast();
  const hasRun = useRef(false);

  useEffect(() => {
    // Only check once per interval, and only after data has loaded
    if (hasRun.current || tasks.length === 0 && exams.length === 0) return;
    if (!shouldCheck()) return;

    hasRun.current = true;
    markChecked();

    const prefs = getPrefs();
    const notifications = [];

    // ── Deadline reminders (due within 24 hours) ──
    if (prefs.deadlineReminder) {
      const urgentTasks = tasks.filter(t => {
        if (t.status === 'done') return false;
        const d = daysUntil(t.due_date);
        return d !== null && d >= 0 && d <= 1;
      });

      urgentTasks.forEach(task => {
        const d = daysUntil(task.due_date);
        const label = d === 0 ? 'due TODAY' : 'due TOMORROW';
        notifications.push({
          title: 'Deadline Reminder',
          message: `"${task.title}" is ${label}!${task.grade_weight ? ` (${task.grade_weight}% weight)` : ''}`,
          type: 'reminder',
        });
      });

      // Exams happening tomorrow or today
      const urgentExams = exams.filter(e => {
        const d = daysUntil(e.exam_date);
        return d !== null && d >= 0 && d <= 1;
      });

      urgentExams.forEach(exam => {
        const d = daysUntil(exam.exam_date);
        const label = d === 0 ? 'TODAY' : 'TOMORROW';
        notifications.push({
          title: 'Exam Alert',
          message: `${exam.subject} exam is ${label}!`,
          type: 'warning',
        });
      });
    }

    // ── Focus plan alert (show if user has active tasks) ──
    if (prefs.focusPlanAlert) {
      const activeTasks = tasks.filter(t => t.status !== 'done');
      const dueThisWeek = activeTasks.filter(t => {
        const d = daysUntil(t.due_date);
        return d !== null && d >= 0 && d <= 7;
      });

      if (dueThisWeek.length >= 3) {
        notifications.push({
          title: 'Focus Plan',
          message: `You have ${dueThisWeek.length} tasks due this week. Check your Focus Plan for today's priorities.`,
          type: 'info',
        });
      }
    }

    // ── Weekly digest (show summary on Mondays or if many tasks) ──
    if (prefs.weeklyDigest) {
      const today = new Date();
      if (today.getDay() === 1) { // Monday
        const activeTasks = tasks.filter(t => t.status !== 'done');
        const doneTasks = tasks.filter(t => t.status === 'done');
        const upcomingExams = exams.filter(e => {
          const d = daysUntil(e.exam_date);
          return d !== null && d >= 0;
        });

        notifications.push({
          title: 'Weekly Digest',
          message: `This week: ${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}, ${upcomingExams.length} exam${upcomingExams.length !== 1 ? 's' : ''} ahead. ${doneTasks.length} completed so far!`,
          type: 'info',
          duration: 8000,
        });
      }
    }

    // Show notifications with staggered delays
    notifications.forEach((notif, idx) => {
      setTimeout(() => {
        // In-app toast
        addToast(notif.message, {
          type: notif.type,
          title: notif.title,
          duration: notif.duration || 6000,
        });

        // Browser notification (if enabled)
        if (prefs.browser) {
          showBrowserNotification(notif.title, notif.message);
        }
      }, idx * 1500); // stagger by 1.5s
    });
  }, [tasks, exams, addToast]);

  return null; // This component renders nothing
}
