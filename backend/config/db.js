const mongoose = require('mongoose');
const logger = require('../utils/logger');

const mongoOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    retryReads: true,
};

const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            logger.info(`🔄 MongoDB connection attempt ${i + 1}/${retries}...`);
            const conn = await mongoose.connect(process.env.MONGO_URI, mongoOptions);
            logger.info(`✅ MongoDB connected → ${conn.connection.host}`);

            // Log collection counts on startup
            try {
                const db = conn.connection.db;
                const [users, properties] = await Promise.all([
                    db.collection('users').countDocuments(),
                    db.collection('properties').countDocuments(),
                ]);
                logger.info(`📊 DB Stats — Users: ${users} | Properties: ${properties}`);
            } catch (_) {}

            return; // success
        } catch (err) {
            logger.error(`❌ MongoDB attempt ${i + 1} failed: ${err.message}`);
            if (i < retries - 1) {
                logger.warn(`⏳ Retrying in ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                logger.error('❌ All MongoDB connection attempts exhausted. Exiting.');
                process.exit(1);
            }
        }
    }
};

// Connection event listeners
mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});
mongoose.connection.on('reconnected', () => {
    logger.info('✅ MongoDB reconnected successfully');
});
mongoose.connection.on('error', (err) => {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
});

module.exports = connectWithRetry;
