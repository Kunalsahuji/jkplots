/**
 * Centralized image URL resolver.
 *
 * - If the image is already a full URL (http/https, data URI, or src-relative), return as-is.
 * - If it's a server-relative path (e.g. /uploads/img.jpg), prefix with the backend base URL.
 *
 * The backend base URL is read from VITE_API_URL env variable, stripping the trailing '/api'.
 * Locally:     http://localhost:5000
 * Production:  https://jkplots.onrender.com
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE = API_URL.replace(/\/api\/?$/, '');

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

/**
 * Resolves an image path to a full URL.
 * @param {string|null|undefined} img - image path or URL
 * @param {string} [fallback] - optional custom fallback image URL
 * @returns {string} fully qualified image URL
 */
export const resolveImage = (img, fallback = FALLBACK_IMAGE) => {
    if (!img) return fallback;
    // Already a full URL or data URI
    if (img.startsWith("http") || img.startsWith("data:") || img.startsWith("blob:")) return img;
    // Vite src-relative import
    if (img.startsWith("/src/")) return img;
    // Server-relative path — prefix with backend base URL
    return `${BACKEND_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
};

export { FALLBACK_IMAGE };
