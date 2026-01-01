// Performance utilities for frontend optimization

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      func.apply(null, args);
    }
  };
}

/**
 * Lazy loading utility for components
 */
export function lazyLoad<T>(importFunc: () => Promise<T>) {
  return importFunc;
}

/**
 * Virtual scrolling utility for large lists
 */
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private buffer: number;

  constructor(container: HTMLElement, itemHeight: number, buffer = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
  }

  getVisibleRange(scrollTop: number, containerHeight: number, totalItems: number) {
    const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const visibleItems = Math.ceil(containerHeight / this.itemHeight);
    const end = Math.min(totalItems, start + visibleItems + this.buffer * 2);
    
    return { start, end };
  }
}

/**
 * Image lazy loading with intersection observer
 */
export class ImageLazyLoader {
  private observer: IntersectionObserver;

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              this.observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );
  }

  observe(img: HTMLImageElement) {
    this.observer.observe(img);
  }

  disconnect() {
    this.observer.disconnect();
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static cache = new Map<string, any>();
  private static maxCacheSize = 100;

  static set(key: string, value: any) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  static get(key: string) {
    return this.cache.get(key);
  }

  static clear() {
    this.cache.clear();
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  static measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
      };
    }
    return null;
  }

  private static getFirstContentfulPaint() {
    const entries = performance.getEntriesByType('paint');
    const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcp?.startTime || 0;
  }

  static measureComponentRender(componentName: string, renderFn: () => void) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    console.log(`${componentName} render time: ${end - start}ms`);
  }
}
