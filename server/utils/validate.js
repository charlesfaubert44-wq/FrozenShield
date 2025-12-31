/**
 * Validation Utilities
 * Provides validation functions for common input types
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
    if (typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validatePassword = (password) => {
    const result = {
        isValid: true,
        errors: []
    };

    if (typeof password !== 'string') {
        return { isValid: false, errors: ['Password must be a string'] };
    }

    if (password.length < 8) {
        result.errors.push('Password must be at least 8 characters long');
        result.isValid = false;
    }

    if (password.length > 128) {
        result.errors.push('Password must not exceed 128 characters');
        result.isValid = false;
    }

    if (!/[a-z]/.test(password)) {
        result.errors.push('Password must contain at least one lowercase letter');
        result.isValid = false;
    }

    if (!/[A-Z]/.test(password)) {
        result.errors.push('Password must contain at least one uppercase letter');
        result.isValid = false;
    }

    if (!/[0-9]/.test(password)) {
        result.errors.push('Password must contain at least one number');
        result.isValid = false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        result.errors.push('Password must contain at least one special character');
        result.isValid = false;
    }

    return result;
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
const validateUsername = (username) => {
    const result = {
        isValid: true,
        errors: []
    };

    if (typeof username !== 'string') {
        return { isValid: false, errors: ['Username must be a string'] };
    }

    if (username.length < 3) {
        result.errors.push('Username must be at least 3 characters long');
        result.isValid = false;
    }

    if (username.length > 30) {
        result.errors.push('Username must not exceed 30 characters');
        result.isValid = false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        result.errors.push('Username can only contain letters, numbers, underscores, and hyphens');
        result.isValid = false;
    }

    return result;
};

/**
 * Validate file extension against whitelist
 * @param {string} filename - Filename to validate
 * @param {string[]} allowedExtensions - Array of allowed extensions
 * @returns {boolean} True if valid extension
 */
const isValidFileExtension = (filename, allowedExtensions) => {
    if (typeof filename !== 'string' || !Array.isArray(allowedExtensions)) {
        return false;
    }

    const extension = filename.split('.').pop().toLowerCase();
    return allowedExtensions.includes(extension);
};

/**
 * Validate MIME type against whitelist
 * @param {string} mimetype - MIME type to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if valid MIME type
 */
const isValidMimeType = (mimetype, allowedTypes) => {
    if (typeof mimetype !== 'string' || !Array.isArray(allowedTypes)) {
        return false;
    }

    return allowedTypes.some(type => {
        // Support wildcards like 'image/*'
        if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return mimetype.startsWith(category + '/');
        }
        return mimetype === type;
    });
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
const isValidObjectId = (id) => {
    if (typeof id !== 'string') {
        return false;
    }

    return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const isValidURL = (url) => {
    if (typeof url !== 'string') {
        return false;
    }

    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch (error) {
        return false;
    }
};

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {boolean} True if size is valid
 */
const isValidFileSize = (size, maxSize) => {
    if (typeof size !== 'number' || typeof maxSize !== 'number') {
        return false;
    }

    return size > 0 && size <= maxSize;
};

/**
 * Validate IP address format
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IP
 */
const isValidIP = (ip) => {
    if (typeof ip !== 'string') {
        return false;
    }

    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
        const parts = ip.split('.');
        return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });
    }

    // IPv6
    const ipv6Regex = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;
    return ipv6Regex.test(ip);
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validated parameters
 */
const validatePagination = (page, limit) => {
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    return {
        page: validatedPage,
        limit: validatedLimit,
        skip: (validatedPage - 1) * validatedLimit
    };
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if valid length
 */
const isValidLength = (str, min, max) => {
    if (typeof str !== 'string') {
        return false;
    }

    const length = str.trim().length;
    return length >= min && length <= max;
};

/**
 * Validate phone number format (basic)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
const isValidPhone = (phone) => {
    if (typeof phone !== 'string') {
        return false;
    }

    // Remove common formatting characters
    const cleaned = phone.replace(/[\s().-]/g, '');

    // Check if it's all digits and reasonable length
    return /^\+?\d{10,15}$/.test(cleaned);
};

/**
 * Validate date string
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date
 */
const isValidDate = (dateStr) => {
    if (typeof dateStr !== 'string') {
        return false;
    }

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
};

module.exports = {
    isValidEmail,
    validatePassword,
    validateUsername,
    isValidFileExtension,
    isValidMimeType,
    isValidObjectId,
    isValidURL,
    isValidFileSize,
    isValidIP,
    validatePagination,
    isValidLength,
    isValidPhone,
    isValidDate
};
