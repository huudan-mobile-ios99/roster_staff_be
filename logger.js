const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

const logger = createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new transports.Console(),
        new DailyRotateFile({
            filename: path.join(__dirname, 'logs', 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '5m',
            maxFiles: '14d', // Keep logs for 14 days
        }),
        new DailyRotateFile({
            filename: path.join(__dirname, 'logs', 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '5m',
            maxFiles: '14d',
        }),
    ],
});

module.exports = logger;
