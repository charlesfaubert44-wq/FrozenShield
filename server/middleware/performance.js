/**
 * Performance Monitoring Middleware
 * Tracks response times, database query performance, and API metrics
 */

/**
 * Store for performance metrics
 */
const metrics = {
    requests: {
        total: 0,
        byEndpoint: new Map(),
        byMethod: new Map(),
        byStatusCode: new Map()
    },
    responseTimes: {
        all: [],
        byEndpoint: new Map()
    },
    errors: {
        total: 0,
        byType: new Map(),
        recent: []
    },
    slowQueries: [],
    startTime: Date.now()
};

// Keep only last 1000 response times to prevent memory issues
const MAX_RESPONSE_TIMES = 1000;
const MAX_SLOW_QUERIES = 100;
const MAX_RECENT_ERRORS = 50;

/**
 * Response time tracking middleware
 */
const trackResponseTime = (req, res, next) => {
    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture response time
    res.end = function (...args) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Track metrics
        trackRequest(req, res, responseTime);

        // Call original end function
        originalEnd.apply(res, args);
    };

    next();
};

/**
 * Track request metrics
 */
const trackRequest = (req, res, responseTime) => {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const method = req.method;
    const statusCode = res.statusCode;

    // Increment total requests
    metrics.requests.total++;

    // Track by endpoint
    const endpointCount = metrics.requests.byEndpoint.get(endpoint) || 0;
    metrics.requests.byEndpoint.set(endpoint, endpointCount + 1);

    // Track by method
    const methodCount = metrics.requests.byMethod.get(method) || 0;
    metrics.requests.byMethod.set(method, methodCount + 1);

    // Track by status code
    const statusCount = metrics.requests.byStatusCode.get(statusCode) || 0;
    metrics.requests.byStatusCode.set(statusCode, statusCount + 1);

    // Track response times
    metrics.responseTimes.all.push(responseTime);
    if (metrics.responseTimes.all.length > MAX_RESPONSE_TIMES) {
        metrics.responseTimes.all.shift();
    }

    // Track by endpoint
    const endpointTimes = metrics.responseTimes.byEndpoint.get(endpoint) || [];
    endpointTimes.push(responseTime);
    if (endpointTimes.length > 100) {
        endpointTimes.shift();
    }
    metrics.responseTimes.byEndpoint.set(endpoint, endpointTimes);

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
        console.warn(`Slow request detected: ${endpoint} took ${responseTime}ms`);
    }
};

/**
 * Track database query performance
 */
const trackSlowQuery = (query, duration, collection) => {
    if (duration > 100) { // Track queries slower than 100ms
        const slowQuery = {
            query: JSON.stringify(query),
            duration,
            collection,
            timestamp: new Date()
        };

        metrics.slowQueries.push(slowQuery);

        if (metrics.slowQueries.length > MAX_SLOW_QUERIES) {
            metrics.slowQueries.shift();
        }

        if (duration > 500) {
            console.warn(`Very slow query detected: ${collection} took ${duration}ms`);
        }
    }
};

/**
 * Track errors
 */
const trackError = (error, req) => {
    metrics.errors.total++;

    const errorType = error.name || 'UnknownError';
    const count = metrics.errors.byType.get(errorType) || 0;
    metrics.errors.byType.set(errorType, count + 1);

    // Store recent errors
    metrics.errors.recent.push({
        type: errorType,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        endpoint: req ? `${req.method} ${req.path}` : 'unknown',
        timestamp: new Date()
    });

    if (metrics.errors.recent.length > MAX_RECENT_ERRORS) {
        metrics.errors.recent.shift();
    }
};

/**
 * Calculate statistics from array of numbers
 */
const calculateStats = (values) => {
    if (values.length === 0) {
        return { min: 0, max: 0, avg: 0, median: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round(sum / sorted.length),
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
    };
};

/**
 * Get performance metrics summary
 */
const getMetrics = () => {
    const uptime = Date.now() - metrics.startTime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    // Calculate response time statistics
    const responseTimeStats = calculateStats(metrics.responseTimes.all);

    // Get top slowest endpoints
    const endpointStats = [];
    for (const [endpoint, times] of metrics.responseTimes.byEndpoint.entries()) {
        const stats = calculateStats(times);
        const count = metrics.requests.byEndpoint.get(endpoint) || 0;
        endpointStats.push({
            endpoint,
            count,
            avgResponseTime: stats.avg,
            maxResponseTime: stats.max,
            p95: stats.p95
        });
    }

    endpointStats.sort((a, b) => b.avgResponseTime - a.avgResponseTime);

    // Calculate error rate
    const errorRate = metrics.requests.total > 0
        ? ((metrics.errors.total / metrics.requests.total) * 100).toFixed(2)
        : 0;

    // Calculate requests per minute
    const requestsPerMinute = uptime > 0
        ? Math.round((metrics.requests.total / uptime) * 60000)
        : 0;

    return {
        uptime: {
            ms: uptime,
            formatted: `${uptimeHours}h ${uptimeMinutes}m`
        },
        requests: {
            total: metrics.requests.total,
            perMinute: requestsPerMinute,
            byMethod: Object.fromEntries(metrics.requests.byMethod),
            byStatusCode: Object.fromEntries(metrics.requests.byStatusCode)
        },
        performance: {
            responseTime: responseTimeStats,
            slowestEndpoints: endpointStats.slice(0, 10)
        },
        errors: {
            total: metrics.errors.total,
            rate: `${errorRate}%`,
            byType: Object.fromEntries(metrics.errors.byType),
            recent: metrics.errors.recent.slice(-10)
        },
        database: {
            slowQueries: metrics.slowQueries.slice(-20)
        },
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            cpuUsage: process.cpuUsage()
        }
    };
};

/**
 * Reset metrics (useful for testing or periodic resets)
 */
const resetMetrics = () => {
    metrics.requests = {
        total: 0,
        byEndpoint: new Map(),
        byMethod: new Map(),
        byStatusCode: new Map()
    };
    metrics.responseTimes = {
        all: [],
        byEndpoint: new Map()
    };
    metrics.errors = {
        total: 0,
        byType: new Map(),
        recent: []
    };
    metrics.slowQueries = [];
    metrics.startTime = Date.now();
};

/**
 * Error tracking middleware
 */
const errorTracker = (err, req, res, next) => {
    trackError(err, req);
    next(err);
};

module.exports = {
    trackResponseTime,
    trackSlowQuery,
    trackError,
    getMetrics,
    resetMetrics,
    errorTracker
};
