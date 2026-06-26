const jwt = require('jsonwebtoken');

/**
 * Generates a short-lived JWT access token (15 minutes).
 * @param {string} userId - MongoDB user _id
 * @returns {string} Signed JWT
 */
const generateAccessToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

/**
 * Generates a long-lived JWT refresh token (30 days).
 * @param {string} userId - MongoDB user _id
 * @returns {string} Signed JWT
 */
const generateRefreshToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '30d',
    });

/**
 * Sets both tokens as secure httpOnly cookies on the response.
 * httpOnly = not accessible via JS (XSS protection)
 * sameSite = CSRF protection
 *
 * @param {Object} res - Express response object
 * @param {string} userId - MongoDB user _id
 */
const sendTokenCookies = (res, userId) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    const isProd = process.env.NODE_ENV === 'production';

    // Access token cookie — 30 days
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax', // 'none' required for cross-domain (Render + Vercel)
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    });

    // Refresh token cookie — 30 days
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax', // 'none' required for cross-domain (Render + Vercel)
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    });

    return { accessToken, refreshToken };
};

/**
 * Clears both auth cookies on logout.
 * @param {Object} res - Express response object
 */
const clearTokenCookies = (res) => {
    res.cookie('accessToken', '', { maxAge: 0, httpOnly: true });
    res.cookie('refreshToken', '', { maxAge: 0, httpOnly: true });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokenCookies, clearTokenCookies };
