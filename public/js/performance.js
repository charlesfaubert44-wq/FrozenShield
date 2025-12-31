/**
 * Frontend Performance Optimization Utilities
 * Provides lazy loading, debouncing, and other performance enhancements
 */

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Lazy load images using Intersection Observer
 */
class LazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.01,
            loadingClass: options.loadingClass || 'lazy-loading',
            loadedClass: options.loadedClass || 'lazy-loaded',
            errorClass: options.errorClass || 'lazy-error'
        };

        this.observer = null;
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );

            this.observeImages();
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadAllImages();
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadImage(img) {
        img.classList.add(this.options.loadingClass);

        // Load source from data attributes
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (!src && !srcset) {
            return;
        }

        // Create a new image to preload
        const tempImg = new Image();

        tempImg.onload = () => {
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;

            img.classList.remove(this.options.loadingClass);
            img.classList.add(this.options.loadedClass);

            // Remove data attributes to prevent reloading
            delete img.dataset.src;
            delete img.dataset.srcset;
        };

        tempImg.onerror = () => {
            img.classList.remove(this.options.loadingClass);
            img.classList.add(this.options.errorClass);
            console.error(`Failed to load image: ${src || srcset}`);
        };

        if (srcset) {
            tempImg.srcset = srcset;
        }
        if (src) {
            tempImg.src = src;
        }
    }

    observeImages() {
        const images = document.querySelectorAll('img[data-src], img[data-srcset]');
        images.forEach(img => this.observer.observe(img));
    }

    loadAllImages() {
        // Fallback: load all images immediately
        const images = document.querySelectorAll('img[data-src], img[data-srcset]');
        images.forEach(img => this.loadImage(img));
    }

    refresh() {
        // Observe any new lazy images that were added to the DOM
        if (this.observer) {
            this.observeImages();
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Lazy load sections/content using Intersection Observer
 */
class ContentLazyLoader {
    constructor(selector = '[data-lazy-content]', options = {}) {
        this.selector = selector;
        this.options = {
            rootMargin: options.rootMargin || '100px',
            threshold: options.threshold || 0.01,
            loadedClass: options.loadedClass || 'content-loaded'
        };

        this.observer = null;
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );

            this.observeElements();
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadContent(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadContent(element) {
        // Add loaded class to trigger CSS animations
        element.classList.add(this.options.loadedClass);

        // Execute any callback defined in data attribute
        const callback = element.dataset.lazyCallback;
        if (callback && typeof window[callback] === 'function') {
            window[callback](element);
        }

        // Trigger custom event
        element.dispatchEvent(new CustomEvent('lazy-loaded', { bubbles: true }));
    }

    observeElements() {
        const elements = document.querySelectorAll(this.selector);
        elements.forEach(el => this.observer.observe(el));
    }

    refresh() {
        if (this.observer) {
            this.observeElements();
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Loading skeleton placeholder
 */
class SkeletonLoader {
    static create(type = 'card', count = 1) {
        const templates = {
            card: `
                <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text"></div>
                    </div>
                </div>
            `,
            list: `
                <div class="skeleton-list-item">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-text"></div>
                </div>
            `,
            text: `
                <div class="skeleton-text-block">
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                </div>
            `
        };

        const template = templates[type] || templates.card;
        return template.repeat(count);
    }

    static show(container, type = 'card', count = 1) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (container) {
            container.innerHTML = this.create(type, count);
            container.classList.add('skeleton-loading');
        }
    }

    static hide(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (container) {
            container.classList.remove('skeleton-loading');
        }
    }
}

/**
 * Request idle callback wrapper with fallback
 */
const requestIdleCallback = window.requestIdleCallback ||
    function(cb) {
        const start = Date.now();
        return setTimeout(() => {
            cb({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
            });
        }, 1);
    };

const cancelIdleCallback = window.cancelIdleCallback || clearTimeout;

/**
 * Defer non-critical tasks until browser is idle
 */
function deferTask(task, options = {}) {
    if (typeof task !== 'function') return;

    const timeout = options.timeout || 2000;

    requestIdleCallback((deadline) => {
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
            task();
        }
    }, { timeout });
}

/**
 * Batch DOM reads and writes to avoid layout thrashing
 */
class DOMBatcher {
    constructor() {
        this.readQueue = [];
        this.writeQueue = [];
        this.scheduled = false;
    }

    read(fn) {
        this.readQueue.push(fn);
        this.scheduleFlush();
    }

    write(fn) {
        this.writeQueue.push(fn);
        this.scheduleFlush();
    }

    scheduleFlush() {
        if (this.scheduled) return;
        this.scheduled = true;

        requestAnimationFrame(() => {
            // Execute all reads first
            while (this.readQueue.length > 0) {
                const fn = this.readQueue.shift();
                fn();
            }

            // Then execute all writes
            while (this.writeQueue.length > 0) {
                const fn = this.writeQueue.shift();
                fn();
            }

            this.scheduled = false;
        });
    }
}

/**
 * Resource preloading helpers
 */
const ResourcePreloader = {
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    },

    preloadImages(urls) {
        return Promise.all(urls.map(url => this.preloadImage(url)));
    },

    prefetchLink(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    },

    preconnect(url) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        document.head.appendChild(link);
    }
};

/**
 * Performance monitoring
 */
class PerformanceMonitor {
    static measurePageLoad() {
        if (!window.performance || !window.performance.timing) {
            return null;
        }

        const timing = window.performance.timing;
        return {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            dom: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
            load: timing.loadEventEnd - timing.loadEventStart,
            total: timing.loadEventEnd - timing.navigationStart
        };
    }

    static markStart(name) {
        if (window.performance && window.performance.mark) {
            window.performance.mark(`${name}-start`);
        }
    }

    static markEnd(name) {
        if (window.performance && window.performance.mark) {
            window.performance.mark(`${name}-end`);
            if (window.performance.measure) {
                window.performance.measure(name, `${name}-start`, `${name}-end`);
            }
        }
    }

    static getMeasure(name) {
        if (window.performance && window.performance.getEntriesByName) {
            const measures = window.performance.getEntriesByName(name, 'measure');
            return measures.length > 0 ? measures[0].duration : null;
        }
        return null;
    }
}

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        LazyLoader,
        ContentLazyLoader,
        SkeletonLoader,
        requestIdleCallback,
        cancelIdleCallback,
        deferTask,
        DOMBatcher,
        ResourcePreloader,
        PerformanceMonitor
    };
}
