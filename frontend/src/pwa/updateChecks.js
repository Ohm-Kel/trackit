/** How often an open app checks for a new version. */
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Browsers look for a new service worker when the app is navigated to. An
 * installed app can stay open for days without that, so check hourly as
 * well, while online.
 */
export function checkForUpdatesPeriodically(swUrl, registration) {
  if (!registration) return;
  setInterval(() => {
    if (navigator.onLine) registration.update().catch(() => {});
  }, UPDATE_CHECK_INTERVAL_MS);
}
