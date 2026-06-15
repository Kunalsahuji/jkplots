const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// ─── Load env first (before any other imports that read env) ──────────────────
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const logger = require('./utils/logger');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true); // Allow non-browser clients
            const allowed = [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://127.0.0.1:5173',
                process.env.FRONTEND_URL,
            ].filter(Boolean);
            const isLocal = origin.startsWith('http://192.168.') || origin.startsWith('http://10.');
            if (allowed.includes(origin) || isLocal) {
                callback(null, true);
            } else {
                logger.warn(`🚫 CORS blocked: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Cookie Parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Static uploads ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── MongoDB Query Injection Sanitizer ───────────────────────────────────────
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
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many requests. Retry after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, error: 'Too many requests. Slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/users/send-otp', authLimiter);
app.use('/api/users/verify-otp', authLimiter);
app.use('/api/', apiLimiter);

// ─── HTTP Request Logging (morgan → winston) ──────────────────────────────────
app.use(morgan('dev', { stream: logger.stream }));

// ─── Incoming request logger ──────────────────────────────────────────────────
app.use((req, res, next) => {
    logger.debug(`→ ${req.method} ${req.originalUrl}`);
    next();
});

// ─── Mount Routers ────────────────────────────────────────────────────────────
const propertyRoutes = require('./routes/propertyRoutes');
const userRoutes = require('./routes/userRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const promotionRoutes = require('./routes/promotionRoutes');
const cityRoutes = require('./routes/cityRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const legalRoutes = require('./routes/legalRoutes');

app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/legal', legalRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'JKPlot API is healthy',
        environment: process.env.NODE_ENV,
        uptime: `${Math.round(process.uptime())}s`,
    });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(`🚀 JKPlot API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`🌐 Accepting frontend from: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

    // Check Maps API key
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP_API_KEY;
    if (mapsKey && mapsKey.trim()) {
        logger.info('✅ Google Maps API key loaded');
    } else {
        logger.warn('⚠️  GOOGLE_MAPS_API_KEY not set — location features will be limited');
    }
});

// ─── Process Error Handlers ───────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});
