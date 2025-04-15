// dbconfig.js
const logger = require('./logger'); // Import Winston logger

const config = {
    user: 'IT',
    password: 'Veg@s123',
    database: 'nstl_vegas',
    server: '192.168.100.210',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'SQL2008R2',
        port: 1433
    }
};

logger.info('DB CONFIG: ' + JSON.stringify(config)); // Use Winston logger

module.exports = config;
