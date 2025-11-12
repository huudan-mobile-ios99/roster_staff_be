// dboperation.js
const config = require('../dbconfig');
const sql = require('mssql');
const logger = require('../logger');

// Test database connection
async function testDatabaseConnection() {
    try {
        let pool = await sql.connect(config);
        logger.info('Database connection established successfully to nstl_vegas');
        await pool.close();
        return true;
    } catch (error) {
        logger.error(`Failed to connect to the database: ${error}`);
        return false;
    }
}

// Run connection test at startup
testDatabaseConnection().then(isConnected => {
    if (isConnected) {
        logger.info('Proceeding with application setup');
    } else {
        logger.warn('Application may not function correctly due to database connection failure');
    }
});

// Utility function to clean a single record
function cleanRecord(record) {
    const cleaned = { ...record };

    // Trim whitespace from string fields
    for (let key in cleaned) {
        if (typeof cleaned[key] === 'string') {
            const trimmed = cleaned[key].trim();
            // Replace empty or space-only strings with null (or "" if preferred)
            cleaned[key] = trimmed === '' ? null : trimmed;
        }
    }

    // Fix encoding for Name field (e.g., NGUYEÃN THÒ KIM LINH → NGUYỄN THỊ KIM LINH)
    if (cleaned.Name) {
        // Replace common encoding errors
        cleaned.Name = cleaned.Name
            .replace(/ÃN/g, 'ẼN') // Fix NGUYEÃN
            .replace(/Ò/g, 'Ị');  // Fix THÒ
    }

    // Format Date (if needed)
    if (cleaned.Date) {
        cleaned.Date = new Date(cleaned.Date).toISOString(); // Ensure consistent ISO format
    }

    return cleaned;
}

async function listStaffScheduleAll(startDate, endDate, callback) {
    const query = `SELECT * FROM nstl_vegas.dbo.fLichlamviec('${startDate}', '${endDate}')`;
    try {
        let pool = await sql.connect(config);
        logger.info('Connection established for listStaffScheduleAll');
        let lists = await pool.request().query(query);
        await pool.close();

        // Clean the records
        const cleanedRecords = lists.recordset.map(record => cleanRecord(record));
        logger.info(`Successfully fetched and cleaned ${cleanedRecords.length} staff schedule records from ${startDate} to ${endDate}`);

        callback(null, cleanedRecords);
    } catch (error) {
        logger.error(`Error in listStaffScheduleAll: ${error}`);
        callback(error, null);
    }
}

async function listALPHschedule(startDate, endDate, callback){
    const query = `SELECT * FROM nstl_vegas.dbo.fLichlamviec('${startDate}', '${endDate}')`;
    try {
        let pool = await sql.connect(config);
        logger.info('Connection established for listStaffScheduleAll');
        let lists = await pool.request().query(query);
        await pool.close();

        // Clean the records
        const cleanedRecords = lists.recordset.map(record => cleanRecord(record));
        logger.info(`Successfully fetched and cleaned ${cleanedRecords.length} staff schedule records from ${startDate} to ${endDate}`);

        callback(null, cleanedRecords);
    } catch (error) {
        logger.error(`Error in listStaffScheduleAll: ${error}`);
        callback(error, null);
    }
}




module.exports = {
    listStaffScheduleAll: listStaffScheduleAll,
    listALPHschedule:listALPHschedule,
};
