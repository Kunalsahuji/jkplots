const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// ─── Load environment variables ───────────────────────────────────────────────
dotenv.config();

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
// Sets various HTTP headers to protect against common web vulnerabilities
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// credentials: true is required for httpOnly cookie auth to work cross-origin
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            process.env.FRONTEND_URL,
        ].filter(Boolean),
        credentials: true, // Required for cookies to be sent cross-origin
    })
);

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Cookie Parser ────────────────────────────────────────────────────────────
// Required to read httpOnly JWT cookies from requests
app.use(cookieParser());

// Serve uploads folder statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── MongoDB Query Injection Sanitizer ───────────────────────────────────────
// Strips any keys containing '$' or '.' from req.body, req.params, req.query
// Custom in-place implementation to support Express 5 query read-only getters
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj instanceof Object) {
            for (const key in obj) {
                if (key.startsWith('$') || key.includes('.')) {
                    delete obj[key];
                } else if (obj[key] instanceof Object) {
                    sanitize(obj[key]);
                }
            }
        }
    };
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    if (req.query) sanitize(req.query);
    next();
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Auth routes: strict (prevents OTP brute-force attacks)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 attempts per 15 min per IP
    message: {
        success: false,
        error: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API: relaxed (allows normal browsing)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        success: false,
        error: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/users/send-otp', authLimiter);
app.use('/api/users/verify-otp', authLimiter);
app.use('/api/', apiLimiter);

// ─── Dev Logging ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ─── Mount Routers ────────────────────────────────────────────────────────────
const propertyRoutes = require('./routes/propertyRoutes');
const userRoutes = require('./routes/userRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        environment: process.env.NODE_ENV,
    });
});

// ─── Global Error Handler (must be after all routes) ─────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// ─── Handle Unhandled Promise Rejections ──────────────────────────────────────
process.on('unhandledRejection', (err) => {
    console.error(`\n❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

// ─── Handle Uncaught Exceptions ───────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error(`\n❌ Uncaught Exception: ${err.message}`);
    process.exit(1);
});
