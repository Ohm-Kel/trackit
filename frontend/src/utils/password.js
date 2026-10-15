/**
 * The password rule for sign-up and password reset, so both enforce the same
 * policy. Supabase Auth must be configured with matching requirements
 * (Authentication → Providers → Email), since a client-side check alone can
 * be bypassed by calling Supabase directly.
 */
export const PASSWORD_HINT = '8+ chars, number, special char';

// Supabase hashes passwords with bcrypt, which only uses the first 72 bytes.
const MAX_BYTES = 72;

/** @returns {string | null} Why the password is not acceptable, or null. */
export function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (new TextEncoder().encode(password).length > MAX_BYTES) {
    return 'Password must be at most 72 characters long';
  }
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9\s]/.test(password)) return 'Password must contain at least one special character';
  return null;
}
