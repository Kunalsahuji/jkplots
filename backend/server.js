const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: [
        'http://localhost:5173',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount routers
const properties = require('./routes/propertyRoutes');
const users = require('./routes/userRoutes');
app.use('/api/properties', properties);
app.use('/api/users', users);

// Test endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is healthy' });
});

// Error handler (Must be after routers)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
