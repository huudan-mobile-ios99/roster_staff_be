// dbconfig_connect.js
require('dotenv').config();
const logger = require('../logger');

// Validate environment variables
const requiredEnvVars = [
  'DB_USER_CONNECT',
  'DB_PASSWORD_CONNECT',
  'DB_DATABASE_CONNECT',
  'DB_SERVER_CONNECT',
  'DB_INSTANCE_NAME_CONNECT',
  'DB_PORT_CONNECT'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  logger.error(`Missing required environment variables (VEGAS CONNECT): ${missingVars.join(', ')}`);
  process.exit(1);
}

const config = {
  user: process.env.DB_USER_CONNECT,
  password: process.env.DB_PASSWORD_CONNECT,
  database: process.env.DB_DATABASE_CONNECT,
  server: process.env.DB_SERVER_CONNECT,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE_NAME_CONNECT,
    port: parseInt(process.env.DB_PORT_CONNECT, 10)
  }
};


// ✅ Test connection at startup
(async () => {
  try {
    const pool = await sql.connect(config);
    logger.info(`✅ Connected to VegasConnect DB: ${config.database}`);
    await pool.close();
  } catch (err) {
    logger.error(`❌ Failed to connect to VegasConnect DB (${config.database}): ${err.message}`);
  }
})();

module.exports = config;
