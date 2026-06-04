import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce } from '../lib/autosave'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('debounce', () => {
  it('does not call fn immediately', () => {
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d('a')
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls fn after delay', () => {
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d('a')
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('resets timer on repeated calls — only last call fires', () => {
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d('first')
    vi.advanceTimersByTime(100)
    d('second')
    vi.advanceTimersByTime(100)
    d('third')
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('third')
  })

  it('flush() calls fn immediately without waiting', () => {
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d('x')
    d.flush()
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('x')
  })

  it('flush() does nothing when no pending call', () => {
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d.flush()
    expect(fn).not.toHaveBeenCalled()
  })

  it('flush() prevents the scheduled timer from firing again', () => {
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d('x')
    d.flush()
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('cancel() prevents fn from being called', () => {
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d('x')
    d.cancel()
    vi.advanceTimersByTime(300)
    expect(fn).not.toHaveBeenCalled()
  })

  it('passes multiple args correctly', () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d(1, 2, 3)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith(1, 2, 3)
  })
})
