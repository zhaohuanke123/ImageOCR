/**
 * Performance optimization hooks for event handling
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Throttle function - limits execution to once per specified interval
 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  interval: number
): T {
  let lastExecTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExec = now - lastExecTime;

    if (timeSinceLastExec >= interval) {
      // Enough time has passed, execute immediately
      lastExecTime = now;
      fn(...args);
    } else if (!timeoutId) {
      // Store args for trailing call
      pendingArgs = args;
      // Schedule execution for the remaining time
      timeoutId = setTimeout(() => {
        lastExecTime = Date.now();
        timeoutId = null;
        if (pendingArgs !== null) {
          fn(...pendingArgs);
          pendingArgs = null;
        }
      }, interval - timeSinceLastExec);
    } else {
      // Update pending args
      pendingArgs = args;
    }
  }) as T;
}

/**
 * Request Animation Frame throttle - ensures updates happen at most once per frame
 * This is ideal for animations and visual updates
 */
export function useRafThrottle<T extends (...args: never[]) => void>(
  callback: T
): T {
  const rafRef = useRef<number | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    argsRef.current = args;

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (argsRef.current !== null) {
          callbackRef.current(...argsRef.current);
        }
        rafRef.current = null;
      });
    }
  }, []) as T;
}

/**
 * Standard throttle hook with configurable interval
 */
export function useThrottle<T extends (...args: never[]) => void>(
  callback: T,
  interval: number
): T {
  const callbackRef = useRef(callback);
  const lastExecTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useMemo(() => {
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastExec = now - lastExecTimeRef.current;
      argsRef.current = args;

      if (timeSinceLastExec >= interval) {
        lastExecTimeRef.current = now;
        callbackRef.current(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastExecTimeRef.current = Date.now();
          timeoutRef.current = null;
          if (argsRef.current !== null) {
            callbackRef.current(...argsRef.current);
          }
        }, interval - timeSinceLastExec);
      }
    }) as T;
  }, [interval]);
}

/**
 * Debounce function - delays execution until after a quiet period
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * Debounce hook with configurable delay
 */
export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useMemo(() => {
    return ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay);
    }) as T;
  }, [delay]);
}

/**
 * Hook for stable callback that doesn't trigger re-renders
 * Use this when you need to pass callbacks to child components
 * but want to avoid re-renders when the callback changes
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }) as T, []);
}

/**
 * Hook for managing hover state with optional throttle
 * Reduces re-renders by throttling hover updates
 */
export function useHoverThrottle(
  onHover: (id: string | null) => void,
  interval: number = 16 // ~60fps
): (id: string | null) => void {
  const lastHoveredRef = useRef<string | null | undefined>(undefined);
  const rafRef = useRef<number | null>(null);
  const pendingHoverRef = useRef<string | null>(null);
  const onHoverRef = useRef(onHover);
  const lastExecTimeRef = useRef(0);

  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return useCallback((id: string | null) => {
    // Skip if same as current hover
    if (id === lastHoveredRef.current) return;

    pendingHoverRef.current = id;
    const now = Date.now();
    const timeSinceLastExec = now - lastExecTimeRef.current;

    // Execute immediately if enough time has passed
    if (timeSinceLastExec >= interval) {
      lastExecTimeRef.current = now;
      lastHoveredRef.current = id;
      onHoverRef.current(id);
      return;
    }

    // Schedule for later if not already scheduled
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingHoverRef.current !== lastHoveredRef.current) {
          lastExecTimeRef.current = Date.now();
          lastHoveredRef.current = pendingHoverRef.current;
          onHoverRef.current(pendingHoverRef.current);
        }
        rafRef.current = null;
      });
    }
  }, [interval]);
}

/**
 * Hook for passive event listeners
 * Improves scroll/wheel performance by not blocking the main thread
 */
export function usePassiveEventListener(
  target: EventTarget | null,
  event: string,
  handler: EventListener,
  options: AddEventListenerOptions = {}
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;

    const passiveHandler: EventListener = (e) => handlerRef.current(e);
    target.addEventListener(event, passiveHandler, { passive: true, ...options });

    return () => {
      target.removeEventListener(event, passiveHandler);
    };
  }, [target, event, options]);
}

/**
 * Hook for optimized scroll handling with RAF
 * Use this for scroll event listeners to avoid scroll jank
 */
export function useScrollHandler(
  callback: (scrollY: number) => void,
  throttleMs: number = 16
): (element: HTMLElement | null) => void {
  const callbackRef = useRef(callback);
  const rafRef = useRef<number | null>(null);
  const lastExecTimeRef = useRef(0);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleScroll = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    const now = Date.now();
    const timeSinceLastExec = now - lastExecTimeRef.current;

    if (timeSinceLastExec >= throttleMs) {
      lastExecTimeRef.current = now;
      callbackRef.current(element.scrollTop);
      return;
    }

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (elementRef.current) {
          lastExecTimeRef.current = Date.now();
          callbackRef.current(elementRef.current.scrollTop);
        }
        rafRef.current = null;
      });
    }
  }, [throttleMs]);

  const setElement = useCallback((element: HTMLElement | null) => {
    // Remove listener from previous element
    if (elementRef.current) {
      elementRef.current.removeEventListener('scroll', handleScroll);
    }

    elementRef.current = element;

    // Add listener to new element
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
  }, [handleScroll]);

  return setElement;
}

/**
 * Hook for batch state updates
 * Collects updates and applies them in a single RAF tick
 */
export function useBatchedUpdates<T>(
  applyUpdates: (updates: T[]) => void
): (update: T) => void {
  const updatesRef = useRef<T[]>([]);
  const rafRef = useRef<number | null>(null);
  const applyRef = useRef(applyUpdates);

  useEffect(() => {
    applyRef.current = applyUpdates;
  }, [applyUpdates]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return useCallback((update: T) => {
    updatesRef.current.push(update);

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        const updates = updatesRef.current;
        updatesRef.current = [];
        if (updates.length > 0) {
          applyRef.current(updates);
        }
        rafRef.current = null;
      });
    }
  }, []);
}
