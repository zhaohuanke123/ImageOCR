import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  throttle,
  debounce,
} from '../hooks/useEventOptimization';

describe('Event Optimization Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('throttle', () => {
    it('should call function immediately on first call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('a');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');
    });

    it('should throttle subsequent calls within interval', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('a');
      throttled('b');
      throttled('c');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');
    });

    it('should execute after interval passes', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('a');
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(50);
      throttled('b');
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should allow calls after interval passes', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 50);

      throttled(1);
      expect(fn).toHaveBeenCalledTimes(1);

      // Wait for full interval
      vi.advanceTimersByTime(100);

      throttled(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('debounce', () => {
    it('should delay execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('a');
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');
    });

    it('should cancel previous call on new invocation', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('a');
      vi.advanceTimersByTime(50);

      debounced('b');
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('b');
    });

    it('should only execute last call', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced(1);
      debounced(2);
      debounced(3);

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
    });

    it('should reset timer on each call', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('a');
      vi.advanceTimersByTime(90);

      debounced('b');
      vi.advanceTimersByTime(90);

      debounced('c');
      vi.advanceTimersByTime(90);

      // Still not called because timer keeps resetting
      expect(fn).not.toHaveBeenCalled();

      // Finally wait the full interval
      vi.advanceTimersByTime(10);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('c');
    });
  });
});

describe('Throttle behavior for event optimization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reduce number of calls for rapid events', () => {
    const events: number[] = [];
    const handler = throttle((x: number) => events.push(x), 16); // ~60fps

    // Simulate rapid events
    for (let i = 0; i < 10; i++) {
      handler(i);
    }

    // Should have only one call (the first immediate one)
    expect(events.length).toBe(1);
    expect(events[0]).toBe(0);
  });

  it('should work for hover state deduplication pattern', () => {
    const hoverStates: (string | null)[] = [];
    let lastHovered: string | null = null;

    // Simple deduplication logic
    const handleHover = (id: string | null) => {
      if (id === lastHovered) return;
      lastHovered = id;
      hoverStates.push(id);
    };

    handleHover('node1');
    handleHover('node1'); // Duplicate - should be skipped
    handleHover('node2');
    handleHover('node2'); // Duplicate - should be skipped
    handleHover(null);
    handleHover(null); // Duplicate - should be skipped

    expect(hoverStates).toEqual(['node1', 'node2', null]);
  });

  it('should allow time-based throttling for continuous events', () => {
    const values: number[] = [];
    const handler = throttle((x: number) => values.push(x), 50);

    handler(1); // Immediate
    expect(values).toEqual([1]);

    vi.advanceTimersByTime(50);
    handler(2);
    expect(values).toEqual([1, 2]); // After interval, immediate again

    vi.advanceTimersByTime(50);
    handler(3);
    expect(values).toEqual([1, 2, 3]); // After interval, immediate again
  });
});
