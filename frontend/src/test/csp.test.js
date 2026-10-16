// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy } from '../../vite.config';

const policyFor = (url) => contentSecurityPolicy(url).transformIndexHtml()[0].attrs.content;

describe('Content-Security-Policy build plugin', () => {
  it('allows connections only to the app and the configured Supabase project', () => {
    const policy = policyFor('https://abcd.supabase.co');
    expect(policy).toContain("connect-src 'self' https://abcd.supabase.co wss://abcd.supabase.co");
    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toMatch(/unsafe-eval|\*\.supabase/);
  });

  it('follows a custom Supabase domain', () => {
    expect(policyFor('https://db.example.edu/')).toContain(
      'connect-src \'self\' https://db.example.edu wss://db.example.edu',
    );
  });

  it('refuses to build without a Supabase URL', () => {
    expect(() => policyFor(undefined)).toThrow(/VITE_SUPABASE_URL/);
  });
});
