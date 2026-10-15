import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Registers the service worker and, when a new version has been downloaded,
 * asks the user to reload. The new version only takes over when they accept,
 * so code never changes under a page that is in use (ADR 0007).
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <div
      role="alertdialog"
      aria-labelledby="update-prompt-title"
      className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-4 sm:w-[360px] z-[100] flex items-start gap-3 p-3.5 bg-white border border-border rounded-r shadow-md"
    >
      <RefreshCw aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1">
        <p id="update-prompt-title" className="text-[13px] font-semibold text-text-1">
          A new version of Trackit is available.
        </p>
        <p className="text-[12px] text-text-2 mt-0.5">Reload to update. Anything you haven't saved will be lost.</p>
        <div className="flex gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-rs text-[12px] font-semibold border-none cursor-pointer"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="bg-white text-text-2 border border-border2 px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer hover:border-primary hover:text-primary"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
