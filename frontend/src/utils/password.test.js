import { describe, expect, it } from 'vitest';
import { validatePassword } from './password';

describe('validatePassword', () => {
  it.each([
    ['short1!', /at least 8/],
    ['longenough!', /number/],
    ['longenough1', /special/],
    ['a1!' + 'x'.repeat(70), /too long/],
    // Multi-byte characters count as bytes, as bcrypt sees them.
    ['a1!' + 'é'.repeat(35), /too long/],
    // An accented letter is not a symbol.
    ['café12345', /special/],
  ])('rejects %j', (password, reason) => {
    expect(validatePassword(password)).toMatch(reason);
  });

  it.each(['correct-horse-9', 'Tr4ck!t pass', 'p@ssw0rd_with_underscore'])('accepts %j', (password) => {
    expect(validatePassword(password)).toBeNull();
  });
});
