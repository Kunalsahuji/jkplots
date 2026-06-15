const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect middleware — verifies JWT from httpOnly cookie.
 * Attaches the authenticated user to req.user.
 *
 * Token priority: cookie (httpOnly) → Bearer header (for API clients / mobile)
 *
 * @route  Attached to any protected route
 * @access Private
 */
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Try httpOnly cookie first (web clients)
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    // 2. Fallback: Authorization header (mobile / API clients)
    else if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Access denied. Please log in.', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach minimal user info to request (no password, no tokens)
        req.user = await User.findById(decoded.id).select('-__v');

        // Check if admin
        if (!req.user) {
            const Admin = require('../models/Admin');
            req.user = await Admin.findById(decoded.id).select('-__v -password');
        }

        if (!req.user) {
            return next(new ErrorResponse('User no longer exists.', 401));
        }

        next();
    } catch (err) {
        // Token expired or tampered
        return next(new ErrorResponse('Session expired. Please log in again.', 401));
    }
});

/**
 * Authorize middleware — restricts access to specific roles.
 * Must be used AFTER protect().
 *
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'dealer')
 *
 * @example
 * router.post('/admin', protect, authorize('admin'), controller)
 */
exports.authorize = (...roles) => (req, res, next) => {
    // superadmin has full access, otherwise verify role is included
    const userRole = req.user?.role;
    if (userRole === 'superadmin' || roles.includes(userRole)) {
        return next();
    }
    
    return next(
        new ErrorResponse(
            `Role '${userRole}' is not authorized to access this route.`,
            403
        )
    );
};
