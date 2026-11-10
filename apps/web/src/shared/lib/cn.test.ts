import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('merges tailwind classes and drops the conflict', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
