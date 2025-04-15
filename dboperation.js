// dboperation.js
const config = require('./dbconfig');
const sql = require('mssql');
const logger = require('./logger'); // Import Winston logger
// Test database connection
async function testDatabaseConnection() {
    try {
        let pool = await sql.connect(config);
        console.log('Database connection established successfully to nstl_vegas');
        logger.info('Database connection established successfully to nstl_vegas'); // Use Winston logger
        await pool.close();
        return true;
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        return false;
    }
}

// Run connection test at startup
testDatabaseConnection().then(isConnected => {
    if (isConnected) {
        logger.info('Proceeding with application setup'); // Use Winston logger
    } else {
        logger.warn('Application may not function correctly due to database connection failure'); // Use Winston logger
    }
});

async function listStaffScheduleAll(callback) {
    const query = `SELECT * FROM nstl_vegas.dbo.fLichlamviec('04/07/2025', '04/20/2025')`;
    try {
        let pool = await sql.connect(config);
        console.log('Connection established for listStaffScheduleAll');
        logger.info('Connection established for listStaffScheduleAll'); // Use Winston logger
        let lists = await pool.request().query(query);
        await pool.close();
        callback(null, lists.recordset);
    } catch (error) {
        console.error(`Error in listStaffScheduleAll: ${error}`);
        callback(error, null);
    }
}

module.exports = {
    listStaffScheduleAll: listStaffScheduleAll,
};
