import { WifiOff } from 'lucide-react';
import { useOnline } from '../hooks/useOnline';

/** Tells the user, while offline, that pages show saved data and writes are off. */
export default function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="shrink-0 flex items-center gap-2 px-4 py-2 bg-warning-bg border-b border-warning-border text-text-1 text-[12.5px] font-medium"
    >
      <WifiOff aria-hidden="true" className="w-4 h-4 shrink-0 text-warning" />
      <span>
        <strong className="font-semibold">You're offline, showing saved data.</strong> Adding, editing, chat and
        uploads are turned off until you reconnect.
      </span>
    </div>
  );
}
