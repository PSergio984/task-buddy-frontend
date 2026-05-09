import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2')
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles conditional classes', () => {
    const isTrue = true
    const isFalse = false
    const result = cn('px-2', isTrue && 'py-2', isFalse && 'm-2')
    const expected = 'px-2 py-2'
    expect(result).toBe(expected)
  })
})
