/**
 * The password rule for sign-up and password reset, so both enforce the same
 * policy. Supabase Auth must be configured with matching requirements
 * (Authentication → Providers → Email), since a client-side check alone can
 * be bypassed by calling Supabase directly.
 */
export const PASSWORD_HINT = '8+ chars, number, special char';

// The ASCII symbols Supabase Auth accepts for its "symbols" requirement, so a
// password that passes here also passes there. Accented letters do not count.
const SYMBOLS = /[!@#$%^&*()_+\-=[\]{};':"|<>?,./`~\\]/;

// Supabase hashes passwords with bcrypt, which only uses the first 72 bytes.
const MAX_BYTES = 72;

/** @returns {string | null} Why the password is not acceptable, or null. */
export function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (new TextEncoder().encode(password).length > MAX_BYTES) {
    // Accented letters and emoji take more than one byte each.
    return 'Password is too long (72 bytes at most; some characters count as more than one)';
  }
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!SYMBOLS.test(password)) return 'Password must contain at least one special character';
  return null;
}
