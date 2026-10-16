import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

/**
 * Whether the browser is online, as React Query sees it. Using the same
 * source as React Query keeps the offline banner, disabled controls and
 * paused queries in step.
 */
export function useOnline() {
  return useSyncExternalStore(onlineManager.subscribe.bind(onlineManager), () => onlineManager.isOnline());
}

/** Shown wherever a control that saves or sends is disabled while offline. */
export const OFFLINE_WRITE_MESSAGE = "You're offline. Reconnect to save changes, chat or upload.";
