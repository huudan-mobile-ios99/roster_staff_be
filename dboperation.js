// dboperation.js
const config = require('./dbconfig');
const sql = require('mssql');
const logger = require('./logger');
const DB = '[NSTL_VEGAS_CONNECT]';

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

// Utility function to convert YYYY_MM_DD to YYYY-MM-DD
function convertDateFormat(date) {
    try {
        const [year, month, day] = date.split('_');
        const formattedDate = `${year}-${month}-${day}`;
        const dateObj = new Date(formattedDate);
        if (isNaN(dateObj.getTime())) throw new Error('Invalid date');
        return formattedDate;
    } catch (err) {
        logger.error(`Error converting date format: ${date}, ${err}`);
        throw new Error('Invalid date format');
    }
}
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
    }

    // Format Date (if needed)
    if (cleaned.Date) {
        cleaned.Date = new Date(cleaned.Date).toISOString(); // Ensure consistent ISO format
    }

    return cleaned;
}

async function listStaffScheduleAll(startDate, endDate, callback) {
  try {
    let pool = await sql.connect(config);

    logger.info(`📅 Executing query with dates: ${startDate} to ${endDate}`);

    // Use parameterized query and proper DATE type
    let result = await pool.request()
      .input('startDate', sql.Date, new Date(startDate))
      .input('endDate', sql.Date, new Date(endDate))
      .query(`SELECT * FROM nstl_vegas.dbo.fLichlamviec(@startDate, @endDate)`);

    await pool.close();

    // Clean records first (trim strings etc.)
    const cleanedRecords = result.recordset.map(cleanRecord);

    // Helper to combine date + time into ISO 8601 string
    function combineDateAndTime(dateStr, timeStr) {
      if (!timeStr) return null;
      const date = new Date(dateStr);
      const [hours, minutes] = timeStr.split(':').map(Number);
      date.setUTCHours(hours, minutes, 0, 0);
      return date.toISOString();
    }

    // Convert to camelCase and format times
    const formattedRecords = cleanedRecords.map(record => ({
      code: record.code,
      name: record.Name,
      englishName: record.EnglishName,
      department: record.Department,
      shift: record.shift,
      startTime: combineDateAndTime(record.Date, record.starttime),
      endTime: combineDateAndTime(record.Date, record.endtime),
      clockStartTime: combineDateAndTime(record.Date, record.Clock_StartTime),
      clockEndTime: combineDateAndTime(record.Date, record.Clock_EndTime),
      date: new Date(record.Date).toISOString(),
    }));

    logger.info(`✅ Fetched, cleaned, and formatted ${formattedRecords.length} staff schedule records`);

    callback(null, formattedRecords);
  } catch (error) {
    logger.error(`❌ Error in listStaffScheduleAll: ${error}`);
    callback(error, null);
  }
}

async function getStaffInfoByCode(code) {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ma', sql.VarChar(50), code)
      .query(`
        SELECT
          [ma] AS manv,
          [ten],
          [tenE],
          [ngaysinh],
          [gioitinh],
          [dienthoai],
          [ngayvaolam],
          [ngaylam_tt],
          [ngaynghi],
          [lydonghi],
          [email],
          [email_cty],
          [ngaytao],
          [capnhat]
        FROM [NSTL_VEGAS_CONNECT].[dbo].[NhanVien]
        WHERE LTRIM(RTRIM([ma])) = LTRIM(RTRIM(@ma))
      `);

    // 🧹 Clean up trailing spaces in all string fields
    const trimmedData = result.recordset.map(row => {
      const cleaned = {};
      for (const key in row) {
        const value = row[key];
        cleaned[key] = typeof value === 'string' ? value.trim() : value;
      }
      return cleaned;
    });

    return trimmedData;
  } catch (err) {
    console.error('Database error in getStaffInfoByCode:', err);
    throw err;
  }
}




// 🧩 Get staff info + AL + PH between start & end date
async function getStaffALPHData(staffCode, start, end) {
  try {
    const pool = await sql.connect(config);

    // 🧠 1. Get staff info
    const staffInfo = await pool.request()
      .input('staffCode', sql.VarChar, staffCode)
      .query(`
        SELECT TOP 1 *
        FROM ${DB}.[dbo].[NhanVien]
        WHERE LTRIM(RTRIM(ma)) = LTRIM(RTRIM(@staffCode))
      `);

    if (staffInfo.recordset.length === 0) {
      await pool.close();
      return { status: false, message: `No staff found with code ${staffCode}`, data: null, AL: null, PH: null };
    }

    // 🧹 Clean up whitespace in staff info
    const cleanedStaff = Object.fromEntries(
      Object.entries(staffInfo.recordset[0]).map(([key, value]) => {
        if (typeof value === 'string') {
          return [key, value.trim()];
        }
        return [key, value];
      })
    );

    // 🧠 2. Get AL (Annual Leave)
    const alData = await pool.request()
      .input('staffCode', sql.VarChar, staffCode)
      .input('startDate', sql.Date, start)
      .input('endDate', sql.Date, end)
      .query(`
        SELECT thang, manv, ngay, maphep, phongban, bophan, ton
        FROM ${DB}.[dbo].[phep_al]
        WHERE manv = @staffCode
          AND ngay BETWEEN @startDate AND @endDate
      `);

    // 🧠 3. Get PH (Public Holiday)
    const phData = await pool.request()
      .input('staffCode', sql.VarChar, staffCode)
      .input('startDate', sql.Date, start)
      .input('endDate', sql.Date, end)
      .query(`
        SELECT thang, manv, ngay, maphep, phongban, bophan, ton
        FROM ${DB}.[dbo].[phep_ph]
        WHERE manv = @staffCode AND ngay BETWEEN @startDate AND @endDate
      `);

    await pool.close();

    return {
      status: true,
      message: `Staff info with AL + PH from ${start} to ${end}`,
      data: cleanedStaff,
      AL: alData.recordset,
      PH: phData.recordset
    };

  } catch (err) {
    logger.error(`❌ Error in getStaffALPHData: ${err.message}`);
    return { status: false, error: err.message };
  }
}







async function addAL(staffCode, date, maphep, phongban, bophan, ton) {
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('staffCode', sql.VarChar, staffCode)
      .input('ngay', sql.Date, date)
      .input('maphep', sql.VarChar, maphep)
      .input('phongban', sql.VarChar, phongban)
      .input('bophan', sql.VarChar, bophan)
      .input('ton', sql.Float, ton)
      .query(`
        INSERT INTO ${DB}.[dbo].[phep_al] (manv, ngay, maphep, phongban, bophan, ton)
        VALUES (@staffCode, @ngay, @maphep, @phongban, @bophan, @ton)
      `);
    await pool.close();
    return { status: true, message: 'AL added successfully' };
  } catch (err) {
    logger.error(`❌ Error in addAL: ${err.message}`);
    return { status: false, error: err.message };
  }
}



async function updateAL(staffCode, date, maphep, ton) {
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('staffCode', sql.VarChar, staffCode)
      .input('ngay', sql.Date, date)
      .input('maphep', sql.VarChar, maphep)
      .input('ton', sql.Float, ton)
      .query(`
        UPDATE ${DB}.[dbo].[phep_al]
        SET ton = @ton
        WHERE manv = @staffCode AND ngay = @ngay AND maphep = @maphep
      `);
    await pool.close();
    return { status: true, message: 'AL updated successfully' };
  } catch (err) {
    logger.error(`❌ Error in updateAL: ${err.message}`);
    return { status: false, error: err.message };
  }
}

async function deleteAL(staffCode, date, maphep) {
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('staffCode', sql.VarChar, staffCode)
      .input('ngay', sql.Date, date)
      .input('maphep', sql.VarChar, maphep)
      .query(`
        DELETE FROM ${DB}.[dbo].[phep_al]
        WHERE manv = @staffCode AND ngay = @ngay AND maphep = @maphep
      `);
    await pool.close();
    return { status: true, message: 'AL deleted successfully' };
  } catch (err) {
    logger.error(`❌ Error in deleteAL: ${err.message}`);
    return { status: false, error: err.message };
  }
}

// ➕ Add Shift (with duplicate check)
async function addShift(data) {
  const {
    staffCode,
    date,
    shiftName,
    department,
    division,
    group,
    area,
    note,
    morningLeave,
    locked,
    sync,
    syncVG
  } = data;

  try {
    const pool = await sql.connect(config);

    // 🔍 Step 1: Check if record already exists
    const existing = await pool.request()
      .input('manv', sql.VarChar(50), staffCode)
      .input('ngay', sql.Date, new Date(date))
      .query(`
        SELECT COUNT(*) AS count
        FROM ${DB}.[dbo].[XepCaNgay]
        WHERE manv = @manv AND ngay = @ngay
      `);

    if (existing.recordset[0].count > 0) {
      await pool.close();
      return {
        status: false,
        message: 'Shift already exists for this staff and date',
        data: {
          staffCode,
          date,
          shiftName,
          department,
          division,
          group,
          area,
          note,
          morningLeave: morningLeave || 0,
          locked: locked ?? 0,
          sync: sync ?? 0,
          syncVG: syncVG ?? 0
        }
      };
    }

    // 📝 Step 2: Insert new record if not duplicate
    await pool.request()
      .input('manv', sql.VarChar(50), staffCode)
      .input('ngay', sql.Date, new Date(date))
      .input('maca', sql.VarChar(50), shiftName)
      .input('phongban', sql.VarChar(100), department || 'N/A')
      .input('bophan', sql.VarChar(100), division || 'N/A')
      .input('nhom', sql.VarChar(100), group || 'N/A')
      .input('khuvuc', sql.VarChar(100), area || 'N/A')
      .input('ghichu', sql.VarChar(255), note || '')
      .input('nghisang', sql.Int, morningLeave || 0)
      .input('dakhoa', sql.Int, locked ?? 0)
      .input('capnhat', sql.Int, sync ?? 0)
      .input('capnhat_vg', sql.Int, syncVG ?? 0)
      .query(`
        INSERT INTO ${DB}.[dbo].[XepCaNgay]
          (manv, ngay, maca, phongban, bophan, nhom, khuvuc, ghichu, nghisang, dakhoa, capnhat, capnhat_vg)
        VALUES (@manv, @ngay, @maca, @phongban, @bophan, @nhom, @khuvuc, @ghichu, @nghisang, @dakhoa, @capnhat, @capnhat_vg)
      `);

    await pool.close();

    logger.info(`✅ Shift added for staffCode: ${staffCode} on ${date}`);

    return {
      status: true,
      message: 'Shift added successfully',
      data: {
        staffCode,
        date,
        shiftName,
        department,
        division,
        group,
        area,
        note,
        morningLeave: morningLeave || 0,
        locked: locked ?? 0,
        sync: sync ?? 0,
        syncVG: syncVG ?? 0
      }
    };
  } catch (err) {
    logger.error(`❌ Error in addShift: ${err.message}`);
    return {
      status: false,
      message: `Failed to add shift, ${err.message}`,
      // error: err.message,
      data
    };
  }
}


// ✏️ Edit shift by manv & ngay (update maca, ghichu, capnhat_vg)
async function editShift(data) {
  const { manv, ngay, maca, ghichu, capnhat_vg } = data;
  try {
    const pool = await sql.connect(config);

    // 🔍 Step 1: Check existing shift
    const existing = await pool.request()
      .input('manv', sql.VarChar(50), manv)
      .input('ngay', sql.Date, new Date(ngay))
      .query(`
        SELECT maca, capnhat_vg
        FROM ${DB}.[dbo].[XepCaNgay]
        WHERE manv = @manv AND ngay = @ngay
      `);

    if (existing.recordset.length === 0) {
      await pool.close();
      return {
        status: false,
        message: 'No shift found to update',
        data: {
          staffCode: manv,
          date: ngay,
          shiftName: maca,
          note: ghichu,
          syncVG: capnhat_vg
        }
      };
    }

    const current = existing.recordset[0];
    const currentMaca = current.maca?.trim();
    const currentSyncVG = current.capnhat_vg ?? 0;

    // 🔄 Step 2: Compare both maca & capnhat_vg
    if (currentMaca === maca?.trim() && currentSyncVG === capnhat_vg) {
      await pool.close();
      return {
        status: false,
        message: 'Cannot update due to the same shift and syncVG found',
        data: {
          staffCode: manv,
          date: ngay,
          shiftName: maca,
          note: ghichu,
          syncVG: capnhat_vg
        }
      };
    }

    // 📝 Step 3: Update if any difference (either maca or syncVG changed)
    await pool.request()
      .input('manv', sql.VarChar(50), manv)
      .input('ngay', sql.Date, new Date(ngay))
      .input('maca', sql.VarChar(50), maca || null)
      .input('ghichu', sql.VarChar(255), ghichu || '')
      .input('capnhat_vg', sql.Int, capnhat_vg ?? 0)
      .query(`
        UPDATE ${DB}.[dbo].[XepCaNgay]
        SET maca = @maca, ghichu = @ghichu, capnhat_vg = @capnhat_vg
        WHERE manv = @manv AND ngay = @ngay
      `);

    await pool.close();

    logger.info(`📝 Shift updated for manv: ${manv} on ${ngay}`);

    return {
      status: true,
      message: 'Shift updated successfully',
      data: {
        staffCode: manv,
        date: ngay,
        shiftName: maca,
        note: ghichu || '',
        syncVG: capnhat_vg ?? 0
      }
    };
  } catch (err) {
    logger.error(`❌ Error in editShift: ${err.message}`);
    return {
      status: false,
      message: `Failed to update shift, ${err.message}]`,
      // error: err.message,
      data: {
        staffCode: data.manv,
        date: data.ngay,
        shiftName: data.maca,
        note: data.ghichu,
        syncVG: data.capnhat_vg ?? 0
      }
    };
  }
}




// 📋 Get shift list by staffCode
async function getShiftsByStaffCode(staffCode) {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('manv', sql.VarChar(50), staffCode)
      .query(`
        SELECT
          LTRIM(RTRIM(manv)) AS staffCode,
          ngay AS date,
          LTRIM(RTRIM(maca)) AS shiftName,
          LTRIM(RTRIM(phongban)) AS department,
          LTRIM(RTRIM(bophan)) AS division,
          LTRIM(RTRIM(nhom)) AS [group],
          LTRIM(RTRIM(khuvuc)) AS area,
          LTRIM(RTRIM(ghichu)) AS note,
          nghisang AS morningLeave,
          dakhoa AS locked,
          capnhat AS sync,
          capnhat_vg AS syncVG
        FROM ${DB}.[dbo].[XepCaNgay]
        WHERE manv = @manv
        ORDER BY ngay DESC
      `);
    await pool.close();
    if (result.recordset.length === 0) {
      return {
        status: false,
        message: `No shift data found for staffCode: ${staffCode}`,
        data: []
      };
    }
    return {
      status: true,
      message: 'Shift data retrieved successfully',
      data: result.recordset
    };
  } catch (err) {
    logger.error(`❌ Error in getShiftsByStaffCode: ${err.message}`);
    return {
      status: false,
      message: `Failed to retrieve shift data, ${err.message}`,
      // error: err.message,
      data: []
    };
  }
}

//Machine Time
async function getTimeMachineRecords({ limit = 50, offset = 0 } = {}) {
  try {
    const pool = await sql.connect(config);

    const query = `
      SELECT
        [readers],
        [id_number],
        [dates],
        [times],
        [in_out]
      FROM (
        SELECT
          [readers],
          [id_number],
          [dates],
          [times],
          [in_out],
          ROW_NUMBER() OVER (ORDER BY dates DESC, times DESC) AS row_num,
          COUNT(*) OVER () AS total_rows
        FROM [NSTL_VEGAS_CONNECT].[dbo].[ChamCong]
      ) AS numbered
      WHERE row_num > @offset AND row_num <= @offset + @limit
      ORDER BY dates DESC, times DESC;
    `;

    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(query);

    const total = result.recordset.length > 0 ? result.recordset[0].total_rows : 0;
    const records = result.recordset.map(({ row_num, total_rows, ...row }) => row);

    await pool.close();

    return { records, total };

  } catch (err) {
    console.error("DB Error getTimeMachineRecords:", err);
    throw err;
  }
}

// Helper: Normalize time string
function normalizeTime(t) {
  if (!t) throw new Error("Time is required");
  t = t.trim();

  // Already HH:mm:ss
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;

  // HH:mm → HH:mm:00
  if (/^\d{2}:\d{2}$/.test(t)) return t + ":00";

  // Allow single digit hour: 9:05 → 09:05:00
  if (/^\d{1}:\d{2}$/.test(t)) return "0" + t.padEnd(5, ":00");

  throw new Error("Invalid time format: " + t);
}


function timeStringToDate(timeStr) {
  const normalized = normalizeTime(timeStr); // "15:50" → "15:50:00"
  const [hours, minutes, seconds] = normalized.split(':').map(Number);
  // Use a fixed date in Vietnam time zone (e.g., 2020-01-01) to avoid DST/UTC issues
  const dummyDate = new Date(Date.UTC(2020, 0, 1, hours, minutes, seconds || 0));
  return dummyDate;
}

async function addTimeRecord({ id_number, date, time, in_out }) {
  try {
    const pool = await sql.connect(config);
    const timeDate = timeStringToDate(time); // your existing helper

    const query = `
      INSERT INTO [NSTL_VEGAS_CONNECT].[dbo].[ChamCong]
      ([id_number], [dates], [times], [in_out])
      VALUES (@id_number, @dates, @times, @in_out);

      SELECT
        [readers],
        [id_number],
        CONVERT(varchar, [dates], 23) AS dates,
        CONVERT(varchar, [times], 108) AS times,
        [in_out],
        CASE WHEN [in_out] = 1 THEN 'IN' ELSE 'OUT' END AS in_out_text
      FROM [NSTL_VEGAS_CONNECT].[dbo].[ChamCong]
      WHERE [readers] = SCOPE_IDENTITY();
    `;

    const result = await pool.request()
      .input('id_number', sql.VarChar, id_number)     // ← trimmed already
      .input('dates', sql.Date, date)
      .input('times', sql.Time, timeDate)
      .input('in_out', sql.Int, in_out)
      .query(query);

    const insertedRow = result.recordset?.[0] || result.recordsets?.[1]?.[0];

    if (!insertedRow) {
      throw new Error("Insert succeeded but failed to retrieve record");
    }

    return insertedRow;

  } catch (err) {
    // Detect SQL Server unique constraint violation
    if (err.number === 2601 || err.number === 2627) {
      throw new Error('DUPLICATE_RECORD'); // ← our custom flag
    }

    console.error("DB Error in addTimeRecord:", err);
    throw err;
  }
}

async function updateTimeRecordByIdAndStaff({ readers, id_number, date, time, in_out }) {
  try {
    const pool = await sql.connect(config);
    const timeDate = timeStringToDate(time);

    const query = `
      UPDATE [NSTL_VEGAS_CONNECT].[dbo].[ChamCong]
      SET
        [dates] = @dates,
        [times] = @times,
        [in_out] = @in_out
      OUTPUT
        inserted.readers,
        inserted.id_number,
        CONVERT(varchar, inserted.dates, 23) AS dates,
        CONVERT(varchar, inserted.times, 108) AS times,
        inserted.in_out,
        CASE WHEN inserted.in_out = 1 THEN 'IN' ELSE 'OUT' END AS in_out_text
      WHERE [readers] = @readers
        AND [id_number] = @id_number_clean;  -- Safe match
    `;

    const result = await pool.request()
      .input('readers', sql.Int, readers)
      .input('id_number_clean', sql.VarChar, id_number.trim())  // Remove extra spaces
      .input('dates', sql.Date, date)
      .input('times', sql.Time, timeDate)
      .input('in_out', sql.Int, parseInt(in_out, 10))
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return null; // Not found
    }

    return result.recordset[0];

  } catch (err) {
    console.error("DB Error in updateTimeRecordByIdAndStaff:", err);
    throw err;
  }
}



async function deleteTimeRecord({ readers, id_number }) {
  try {
    const pool = await sql.connect(config);

    const query = `
      DELETE FROM [NSTL_VEGAS_CONNECT].[dbo].[ChamCong]
      OUTPUT
        deleted.readers,
        deleted.id_number,
        CONVERT(varchar, deleted.dates, 23) AS dates,
        CONVERT(varchar, deleted.times, 108) AS times,
        deleted.in_out,
        CASE WHEN deleted.in_out = 1 THEN 'IN' ELSE 'OUT' END AS in_out_text
      WHERE [readers] = @readers
        AND [id_number] = @id_number_clean;
    `;

    const result = await pool.request()
      .input('readers', sql.Int, readers)
      .input('id_number_clean', sql.VarChar, id_number.trim())
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return null; // Not found
    }

    return result.recordset[0];

  } catch (err) {
    console.error("DB Error in deleteTimeRecord:", err);
    throw err;
  }
}

module.exports = {
    listStaffScheduleAll: listStaffScheduleAll,
    getStaffInfoByCode:getStaffInfoByCode,
    getStaffALPHData:getStaffALPHData,
    addAL:addAL,
    //AL & PH
    updateAL:updateAL,
    deleteAL:deleteAL,

    //Add shift
    addShift:addShift,
    editShift:editShift,
    getShiftsByStaffCode:getShiftsByStaffCode,
    //Machine Time
    getTimeMachineRecords:getTimeMachineRecords,
    addTimeRecord:addTimeRecord,
    updateTimeRecordByIdAndStaff:updateTimeRecordByIdAndStaff,
    deleteTimeRecord:deleteTimeRecord,
};

