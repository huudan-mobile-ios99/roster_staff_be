// dbconfig.js
//connect mssql studio acc: IT/Veg@s123 : SQL Authentication
require('dotenv').config(); // Load environment variables from .env
const logger = require('./logger'); // Import Winston logger

// Validate required environment variables
const requiredEnvVars = [
    'DB_USER',
    'DB_PASSWORD',
    'DB_DATABASE',
    'DB_SERVER',
    'DB_INSTANCE_NAME',
    'DB_PORT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1); // Exit the application if variables are missing
}

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: process.env.DB_INSTANCE_NAME,
        port: parseInt(process.env.DB_PORT, 10) // Convert port to integer
    }
};

// Log the config (omit password for security)
const configForLogging = { ...config, password: '[REDACTED]' };
module.exports = config;
