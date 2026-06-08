const jwt = require('jsonwebtoken');

/**
 * Generates a short-lived JWT access token (15 minutes).
 * @param {string} userId - MongoDB user _id
 * @returns {string} Signed JWT
 */
const generateAccessToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
    });

/**
 * Generates a long-lived JWT refresh token (7 days).
 * @param {string} userId - MongoDB user _id
 * @returns {string} Signed JWT
 */
const generateRefreshToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
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

    // Access token cookie — 15 minutes
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 min in ms
    });

    // Refresh token cookie — 7 days
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
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
