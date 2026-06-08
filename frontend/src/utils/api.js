import axios from 'axios';

/**
 * Central Axios instance for all API calls.
 *
 * - baseURL points to the Express backend
 * - withCredentials: true sends httpOnly JWT cookies on every request
 * - Interceptors handle token expiry globally (401 → redirect to /auth)
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // Required for httpOnly cookie auth
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
    // Success: pass through
    (response) => response,

    // Error: handle globally
    (error) => {
        const status = error.response?.status;

        // 401 Unauthorized — session expired or invalid token
        // Redirect to login only if not already on the auth page
        if (status === 401 && !window.location.pathname.startsWith('/auth')) {
            window.location.href = `/auth?redirect=${window.location.pathname}`;
        }

        // Always reject so individual call sites can handle their own errors
        return Promise.reject(error);
    }
);

export default api;
