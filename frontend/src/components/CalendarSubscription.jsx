import { useState } from 'react';
import { Copy, Check, Loader2, RefreshCw, Trash2, ExternalLink, Link2 } from 'lucide-react';
import { useCalendarFeed, useCreateCalendarFeed, useRevokeCalendarFeed } from '../hooks/useCalendarFeed';
import { calendarFeedUrl, webcalUrl } from '../api/calendar';
import { useToast } from './Toast';

const buttonClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border text-text-2 rounded-rs text-[12px] font-semibold cursor-pointer hover:border-primary hover:text-primary transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed';
const primaryButtonClass =
  'inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-rs text-[12.5px] font-semibold border-none cursor-pointer transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed';
const dangerButtonClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#FCA5A5] text-[#B91C1C] rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-[#FEF2F2] transition-all disabled:opacity-60 disabled:cursor-not-allowed';

const INSTRUCTIONS = [
  {
    app: 'Google Calendar',
    steps: 'On a computer, open Google Calendar. Next to "Other calendars", choose + and then "From URL". Paste the link and choose "Add calendar". It then appears on your phone too.',
  },
  {
    app: 'Apple Calendar',
    steps: 'On a Mac, choose File → New Calendar Subscription and paste the link. On iPhone or iPad, open Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar. Or use "Open in calendar app" below.',
  },
  {
    app: 'Outlook',
    steps: 'In Outlook on the web, open the calendar, choose "Add calendar" and then "Subscribe from web". Paste the link, name it Trackit, and choose Import.',
  },
];

function formatCreated(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Settings section for the calendar subscription link: create, copy, rotate
 * and revoke it. The server stores only a hash of the token, so the full link
 * can be shown only right after it is created.
 */
export default function CalendarSubscription() {
  const { addToast } = useToast();
  const { data: feed, isLoading, isError, error, refetch } = useCalendarFeed();
  const createFeed = useCreateCalendarFeed();
  const revokeFeed = useRevokeCalendarFeed();
  const [link, setLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const busy = createFeed.isPending || revokeFeed.isPending;

  function create({ rotate = false } = {}) {
    if (rotate && !window.confirm('Create a new link? Calendars using the current link will stop updating until you add the new one.')) return;
    createFeed.mutate(undefined, {
      onSuccess: ({ path }) => {
        setLink(calendarFeedUrl(path));
        setCopied(false);
      },
      onError: (err) => addToast(err.message, { type: 'error', title: "Couldn't create the link" }),
    });
  }

  function revoke() {
    if (!window.confirm('Revoke the link? Calendars using it will stop updating.')) return;
    revokeFeed.mutate(undefined, {
      onSuccess: () => {
        setLink(null);
        addToast('Calendars using the old link will stop updating.', { type: 'success', title: 'Link revoked' });
      },
      onError: (err) => addToast(err.message, { type: 'error', title: "Couldn't revoke the link" }),
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      addToast('Paste it into your calendar app.', { type: 'success', title: 'Link copied' });
    } catch {
      // Clipboard access can be refused; select the text so it can be copied by hand.
      document.getElementById('calendar-feed-url')?.select();
      addToast('Press Ctrl+C (or ⌘C) to copy the selected link.', { type: 'info', title: 'Copy the link' });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[12.5px] text-text-3 py-6" role="status">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your calendar link…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-bg border border-border rounded-r text-[12.5px] text-text-2" role="alert">
        <p className="mb-3">{error?.message || 'Your calendar link could not be loaded.'}</p>
        <button type="button" onClick={() => refetch()} className={buttonClass}>
          <RefreshCw className="w-3 h-3" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-text-2 leading-relaxed">
        Subscribe to your open tasks and exams from Google Calendar, Apple Calendar or Outlook. They update by
        themselves: open tasks appear as all-day events on their due date, and finished tasks drop off. Calendar
        apps refresh subscriptions on their own schedule, from every few minutes to about a day.
      </p>

      {link ? (
        <div className="p-4 bg-bg border border-border rounded-r space-y-3">
          <label htmlFor="calendar-feed-url" className="block text-[13px] font-semibold text-text-1">
            Your subscription link
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="calendar-feed-url"
              type="text"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[12.5px] font-mono text-text-1 bg-white outline-none focus:border-primary"
            />
            <button type="button" onClick={copy} className={primaryButtonClass}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <p className="text-[12px] text-text-2">
            <strong>Keep this link private.</strong> Anyone who has it can see your task titles and exam dates. It is
            shown only now; Trackit keeps just a fingerprint of it.
          </p>
          <a
            href={webcalUrl(link)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open in calendar app
          </a>
        </div>
      ) : feed?.active ? (
        <div className="p-4 bg-bg border border-border rounded-r text-[12.5px] text-text-2 leading-relaxed">
          <p className="font-semibold text-text-1 mb-1">Your subscription link is active</p>
          <p>
            Created on {formatCreated(feed.created_at)}. For your security, Trackit can't show it again. To add
            another calendar, create a new link; the current one then stops working.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-bg border border-border rounded-r text-[12.5px] text-text-2">
          You don't have a subscription link yet.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {feed?.active ? (
          <>
            <button type="button" onClick={() => create({ rotate: true })} disabled={busy} className={buttonClass}>
              {createFeed.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Create new link
            </button>
            <button type="button" onClick={revoke} disabled={busy} className={dangerButtonClass}>
              {revokeFeed.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Revoke link
            </button>
          </>
        ) : (
          <button type="button" onClick={() => create()} disabled={busy} className={primaryButtonClass}>
            {createFeed.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
            Create subscription link
          </button>
        )}
      </div>

      <div>
        <h2 className="text-[13px] font-semibold text-text-1 mb-2">How to subscribe</h2>
        <ul className="space-y-2.5">
          {INSTRUCTIONS.map(({ app, steps }) => (
            <li key={app} className="text-[12.5px] text-text-2 leading-relaxed">
              <strong className="text-text-1">{app}:</strong> {steps}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-text-3">
          For a one-off copy instead, use Export → Download .ics on the Tasks or Exams page.
        </p>
      </div>
    </div>
  );
}
