/**
 * Input Sanitization Utilities
 * Provides functions to sanitize user inputs and prevent XSS attacks
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
const sanitizeString = (input, options = {}) => {
    if (typeof input !== 'string') {
        return '';
    }

    const {
        allowHTML = false,
        maxLength = null,
        trim = true
    } = options;

    let sanitized = input;

    // Trim whitespace if needed
    if (trim) {
        sanitized = sanitized.trim();
    }

    // Remove HTML if not allowed
    if (!allowHTML) {
        sanitized = sanitized
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Apply max length if specified
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
const sanitizeEmail = (email) => {
    if (typeof email !== 'string') {
        return '';
    }

    return email
        .trim()
        .toLowerCase()
        .replace(/[^\w\s@.-]/g, ''); // Allow only alphanumeric, @, ., -, and whitespace
};

/**
 * Sanitize MongoDB query to prevent NoSQL injection
 * @param {Object} query - Query object to sanitize
 * @returns {Object} Sanitized query
 */
const sanitizeMongoQuery = (query) => {
    if (typeof query !== 'object' || query === null) {
        return {};
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(query)) {
        // Prevent $where and other dangerous operators
        if (key.startsWith('$')) {
            continue;
        }

        // Recursively sanitize nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeMongoQuery(value);
        } else if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value, { allowHTML: false });
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

/**
 * Sanitize filename to prevent directory traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} Safe filename
 */
const sanitizeFilename = (filename) => {
    if (typeof filename !== 'string') {
        return 'file';
    }

    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
        .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
        .replace(/^\.+/, '') // Remove leading dots
        .substring(0, 255); // Limit length
};

/**
 * Sanitize URL to prevent open redirects
 * @param {string} url - URL to sanitize
 * @param {string[]} allowedDomains - List of allowed domains
 * @returns {string|null} Sanitized URL or null if invalid
 */
const sanitizeURL = (url, allowedDomains = []) => {
    if (typeof url !== 'string') {
        return null;
    }

    try {
        const parsed = new URL(url);

        // If allowedDomains is specified, check domain
        if (allowedDomains.length > 0) {
            if (!allowedDomains.includes(parsed.hostname)) {
                return null;
            }
        }

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }

        return parsed.toString();
    } catch (error) {
        // If relative URL, ensure it doesn't contain protocol or domain
        if (url.startsWith('/') && !url.startsWith('//')) {
            return url.split('?')[0].split('#')[0]; // Remove query params and hash
        }
        return null;
    }
};

/**
 * Sanitize object by recursively sanitizing all string values
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj, options = {}) => {
    if (typeof obj !== 'object' || obj === null) {
        return {};
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
        // Skip dangerous keys
        if (key.startsWith('$') || key.startsWith('_')) {
            continue;
        }

        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value, options);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value, options);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeString(item, options) :
                typeof item === 'object' ? sanitizeObject(item, options) :
                item
            );
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

/**
 * Remove null bytes from string (prevents null byte injection)
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
const removeNullBytes = (str) => {
    if (typeof str !== 'string') {
        return '';
    }
    return str.replace(/\0/g, '');
};

/**
 * Sanitize IP address for logging
 * @param {string} ip - IP address to sanitize
 * @returns {string} Sanitized IP
 */
const sanitizeIP = (ip) => {
    if (typeof ip !== 'string') {
        return 'unknown';
    }

    // Basic IPv4/IPv6 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

    if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
        return ip;
    }

    return 'invalid';
};

module.exports = {
    sanitizeString,
    sanitizeEmail,
    sanitizeMongoQuery,
    sanitizeFilename,
    sanitizeURL,
    sanitizeObject,
    removeNullBytes,
    sanitizeIP
};
