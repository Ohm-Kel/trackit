// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { pwaOptions } from '../../vite.config';

const { manifest, workbox } = pwaOptions;
const servesShell = (path) => !workbox.navigateFallbackDenylist.some((pattern) => pattern.test(path));

describe('service worker configuration', () => {
  it('never answers API navigations with the app shell', () => {
    expect(servesShell('/api')).toBe(false);
    expect(servesShell('/api/docs')).toBe(false);
    expect(servesShell('/api/chat/stream')).toBe(false);
    expect(servesShell('/tasks')).toBe(true);
    expect(servesShell('/apiary')).toBe(true);
  });

  it('caches no responses at runtime, so API and Supabase calls always use the network', () => {
    expect(workbox.runtimeCaching).toEqual([]);
  });

  it('waits for the user before activating an update', () => {
    expect(pwaOptions.registerType).toBe('prompt');
    expect(workbox.skipWaiting).toBeUndefined();
    expect(workbox.clientsClaim).toBeUndefined();
  });

  it('describes an installable standalone app with maskable icons', () => {
    expect(manifest).toMatchObject({ short_name: 'Trackit', display: 'standalone', start_url: '/' });
    const sizes = manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose ?? 'any'}`);
    expect(sizes).toEqual(expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']));
  });
});
