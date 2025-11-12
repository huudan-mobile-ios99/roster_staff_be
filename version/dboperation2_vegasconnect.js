// // dboperation.js
// const config = require('./dbconfig2_vegasconnect');
// const sql = require('mssql');
// const logger = require('./logger');

// // Test database connection
// async function testDatabaseConnectionVGConnect() {
//     try {
//         let pool = await sql.connect(config);
//         logger.info('Database connection established successfully to nstl_vegas_connect');
//         await pool.close();
//         return true;
//     } catch (error) {
//         logger.error(`Failed to connect to the database: ${error}`);
//         return false;
//     }
// }

// // Run connection test at startup
// testDatabaseConnectionVGConnect().then(isConnected => {
//     if (isConnected) {
//         logger.info('Proceeding with application setup [nstl_vegas_connect]');
//     } else {
//         logger.warn('Application may not function correctly due to database connection failure');
//     }
// });





// // 🧩 Get staff info + AL + PH between start & end date
// async function getStaffALPHDataVGConnect(staffCode, start, end) {
//   try {
//     const pool = await sql.connect(config);

//     // 🧠 1. Get staff info
//     const staffInfo = await pool.request()
//       .input('staffCode', sql.VarChar, staffCode)
//       .query(`
//         SELECT TOP 1 *
//         FROM [NSTL_VEGAS_CONNECT].[dbo].[NhanVien]
//         WHERE LTRIM(RTRIM(ma)) = LTRIM(RTRIM(@staffCode))
//       `);

//     if (staffInfo.recordset.length === 0) {
//       await pool.close();
//       return { status: false, message: `No staff found with code ${staffCode}`, data: null, AL: null, PH: null };
//     }

//     // 🧹 Clean up whitespace in staff info
//     const cleanedStaff = Object.fromEntries(
//       Object.entries(staffInfo.recordset[0]).map(([key, value]) => {
//         if (typeof value === 'string') {
//           return [key, value.trim()];
//         }
//         return [key, value];
//       })
//     );

//     // 🧠 2. Get AL (Annual Leave)
//     const alData = await pool.request()
//       .input('staffCode', sql.VarChar, staffCode)
//       .input('startDate', sql.Date, start)
//       .input('endDate', sql.Date, end)
//       .query(`
//         SELECT thang, manv, ngay, maphep, phongban, bophan, ton
//         FROM [NSTL_VEGAS_CONNECT].[dbo].[phep_al]
//         WHERE manv = @staffCode
//           AND ngay BETWEEN @startDate AND @endDate
//       `);

//     // 🧠 3. Get PH (Public Holiday)
//     const phData = await pool.request()
//       .input('staffCode', sql.VarChar, staffCode)
//       .input('startDate', sql.Date, start)
//       .input('endDate', sql.Date, end)
//       .query(`
//         SELECT thang, manv, ngay, maphep, phongban, bophan, ton
//         FROM [NSTL_VEGAS_CONNECT].[dbo].[phep_ph]
//         WHERE manv = @staffCode
//           AND ngay BETWEEN @startDate AND @endDate
//       `);

//     await pool.close();

//     return {
//       status: true,
//       message: `Staff info with AL + PH from ${start} to ${end}`,
//       data: cleanedStaff,
//       AL: alData.recordset,
//       PH: phData.recordset
//     };

//   } catch (err) {
//     logger.error(`❌ Error in getStaffALPHData: ${err.message}`);
//     return { status: false, error: err.message };
//   }
// }





// module.exports = {

//     getStaffALPHDataVGConnect:getStaffALPHDataVGConnect,
// };
