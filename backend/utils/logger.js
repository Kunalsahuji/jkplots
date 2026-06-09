const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf, errors } = format;

// ─── Custom log format ────────────────────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
    const base = `${timestamp} [${level}]: ${stack || message}`;
    return base;
});

const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'HH:mm:ss' }),
        colorize({ all: true }),
        consoleFormat
    ),
    transports: [
        new transports.Console(),
    ],
});

// ─── HTTP request logger middleware (replaces morgan) ─────────────────────────
logger.stream = {
    write: (message) => logger.http(message.trim()),
};

module.exports = logger;
