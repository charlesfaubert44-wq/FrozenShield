const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for protected routes
 * Verifies JWT token from Authorization header and attaches admin data to request
 *
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void|Object} Calls next() on success, or returns 401 JSON response on failure
 *
 * @example
 * // Protect a route
 * router.get('/api/admin/data', auth, (req, res) => {
 *   // req.admin contains decoded JWT payload
 *   res.json({ admin: req.admin });
 * });
 *
 * @throws {401} No token provided
 * @throws {401} Invalid or expired token
 */
const auth = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

module.exports = auth;
