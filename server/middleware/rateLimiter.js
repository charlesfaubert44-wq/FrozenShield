/**
 * Advanced Rate Limiting Configuration
 * Provides different rate limiting strategies for various endpoints
 */

const rateLimit = require('express-rate-limit');

/**
 * Store for tracking failed login attempts per IP/user
 */
const loginAttempts = new Map();
const accountLockouts = new Map();

/**
 * General API rate limiter
 * Protects all API endpoints from abuse
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Skip successful requests in count for authenticated users
    skip: (req) => req.user && req.method === 'GET',
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Contact form rate limiter
 * Prevents spam submissions
 */
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 submissions per hour
    message: {
        success: false,
        message: 'Too many contact form submissions, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * File upload rate limiter
 * Prevents abuse of upload endpoints
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: {
        success: false,
        message: 'Too many file uploads, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Registration rate limiter
 * Prevents mass account creation
 */
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour
    message: {
        success: false,
        message: 'Too many registration attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Search/Query rate limiter
 * Prevents database query abuse
 */
const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: {
        success: false,
        message: 'Too many search requests, please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Track failed login attempts
 * @param {string} identifier - IP address or email
 * @returns {number} Number of failed attempts
 */
const trackFailedLogin = (identifier) => {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || [];

    // Remove attempts older than 15 minutes
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
    recentAttempts.push(now);

    loginAttempts.set(identifier, recentAttempts);

    return recentAttempts.length;
};

/**
 * Check if account is locked out
 * @param {string} identifier - IP address or email
 * @returns {Object} Lockout status
 */
const checkAccountLockout = (identifier) => {
    const lockout = accountLockouts.get(identifier);

    if (!lockout) {
        return { locked: false };
    }

    const now = Date.now();

    // Check if lockout has expired
    if (now > lockout.until) {
        accountLockouts.delete(identifier);
        loginAttempts.delete(identifier);
        return { locked: false };
    }

    return {
        locked: true,
        until: lockout.until,
        remainingTime: Math.ceil((lockout.until - now) / 1000) // seconds
    };
};

/**
 * Lock account after too many failed attempts
 * @param {string} identifier - IP address or email
 * @param {number} duration - Lockout duration in milliseconds
 */
const lockAccount = (identifier, duration = 30 * 60 * 1000) => {
    const until = Date.now() + duration;
    accountLockouts.set(identifier, { until });
    return until;
};

/**
 * Reset failed login attempts (on successful login)
 * @param {string} identifier - IP address or email
 */
const resetFailedAttempts = (identifier) => {
    loginAttempts.delete(identifier);
    accountLockouts.delete(identifier);
};

/**
 * Middleware to check account lockout status
 */
const checkLockout = (identifierFn) => {
    return (req, res, next) => {
        const identifier = identifierFn(req);
        const lockoutStatus = checkAccountLockout(identifier);

        if (lockoutStatus.locked) {
            return res.status(429).json({
                success: false,
                message: `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(lockoutStatus.remainingTime / 60)} minutes.`,
                lockedUntil: new Date(lockoutStatus.until).toISOString()
            });
        }

        next();
    };
};

/**
 * Clean up old entries periodically
 */
setInterval(() => {
    const now = Date.now();

    // Clean up login attempts older than 15 minutes
    for (const [identifier, attempts] of loginAttempts.entries()) {
        const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
        if (recentAttempts.length === 0) {
            loginAttempts.delete(identifier);
        } else {
            loginAttempts.set(identifier, recentAttempts);
        }
    }

    // Clean up expired lockouts
    for (const [identifier, lockout] of accountLockouts.entries()) {
        if (now > lockout.until) {
            accountLockouts.delete(identifier);
        }
    }
}, 5 * 60 * 1000); // Run every 5 minutes

module.exports = {
    generalLimiter,
    authLimiter,
    contactLimiter,
    uploadLimiter,
    registrationLimiter,
    passwordResetLimiter,
    searchLimiter,
    trackFailedLogin,
    checkAccountLockout,
    lockAccount,
    resetFailedAttempts,
    checkLockout
};
