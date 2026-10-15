import { useOnline, OFFLINE_WRITE_MESSAGE } from '../hooks/useOnline';

/** Explains, next to a disabled control, why it is disabled while offline. */
export default function OfflineNotice({ id, className = '' }) {
  const online = useOnline();
  if (online) return null;
  return (
    <p id={id} className={`text-[12px] font-medium text-text-2 ${className}`}>
      {OFFLINE_WRITE_MESSAGE}
    </p>
  );
}
