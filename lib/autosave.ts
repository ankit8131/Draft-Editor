type DebouncedFn<T extends unknown[]> = {
  (...args: T): void
  flush: () => void
  cancel: () => void
}

export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout>
  let pending: (() => void) | null = null

  const debounced = (...args: T) => {
    clearTimeout(timer)
    pending = () => fn(...args)
    timer = setTimeout(() => { pending?.(); pending = null }, ms)
  }

  debounced.flush = () => {
    clearTimeout(timer)
    if (pending) { pending(); pending = null }
  }

  debounced.cancel = () => {
    clearTimeout(timer)
    pending = null
  }

  return debounced
}
