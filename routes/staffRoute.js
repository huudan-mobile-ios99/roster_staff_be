const express = require('express');
const router = express.Router();
const dboperation = require('../dboperation');
const logger = require('../logger');


// 🗓 Staff schedule (old)
router.post('/schedule_list_old', (req, res) => {
  const { start_date, end_date } = req.body;
  if (!start_date || !end_date) {
    logger.warn('Missing startDate or endDate in request body');
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const dateFormatRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
  if (!dateFormatRegex.test(start_date) || !dateFormatRegex.test(end_date)) {
    logger.warn(`Invalid date format: startDate=${start_date}, endDate=${end_date}`);
    return res.status(400).json({ error: 'Dates must be in MM/DD/YYYY format' });
  }

  dboperation.listStaffScheduleAll(start_date, end_date, (err, result) => {
    if (err) {
      logger.error(`Error in listStaffScheduleAll: ${err}`);
      return res.status(500).json({ error: 'Failed to fetch staff schedule' });
    }
    res.json(result);
  });
});

// 🗓 Staff schedule (new)
router.get('/schedule_list', (req, res) => {
  const { startDate, endDate } = req.query; // <-- updated field names

  if (!startDate || !endDate) {
    logger.warn('Missing startDate or endDate in request body');
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  // Validate YYYY-MM-DD format
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateFormatRegex.test(startDate) || !dateFormatRegex.test(endDate)) {
    logger.warn(`Invalid date format: startDate=${startDate}, endDate=${endDate}`);
    return res.status(400).json({ error: 'Dates must be in YYYY-MM-DD format' });
  }

  dboperation.listStaffScheduleAll(startDate, endDate, (err, result) => {
    if (err) {
      logger.error(`Error in listStaffScheduleAll: ${err}`);
      return res.status(500).json({ error: 'Failed to fetch staff schedule' });
    }
    res.json(result);
  });
});

// 👤 Get staff info by code
router.post('/info', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    logger.warn('Missing code in request body');
    return res.status(400).json({
      status: false,
      message: 'Field "code" is required',
      data: {},
    });
  }

  try {
    const result = await dboperation.getStaffInfoByCode(code.trim());
    if (!result || result.length === 0) {
      return res.status(200).json({
        status: false,
        message: `No staff found for this code`,
        data: {},
      });
    }

    const s = result[0];
    const mappedStaff = {
      code: s.manv,
      name: s.ten,
      name_en: s.tenE,
      dob: s.ngaysinh,
      gender: s.gioitinh,
      number: s.dienthoai,
      address: s.diachi,
      date_first: s.ngayvaolam,
      date_official: s.ngaylam_tt,
      date_resign: s.ngaynghi,
      reason_resign: s.lydonghi,
      email: s.email,
      email_work: s.email_cty,
      createAt: s.ngaytao,
      updated: s.capnhat,
    };

    res.status(200).json({
      status: true,
      message: `Get staff info data of code ${code}`,
      data: mappedStaff,
    });
  } catch (err) {
    logger.error(`Error fetching staff info: ${err.message}`);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch staff info',
      data: {},
    });
  }
});




router.get('/al_ph', async (req, res) => {
  const { staffCode, start, end } = req.query;

  if (!staffCode || !start || !end) {
    return res.status(400).json({
      status: false,
      message: 'Missing parameters: staffCode, start, and end are required.',
    });
  }

  const result = await dboperation.getStaffALPHData(staffCode, start, end);
  res.json(result);
});


// POST /api/staff_leave/add_al
router.post('/add_al', async (req, res) => {
  const { staffCode, date, maphep, phongban, bophan, ton } = req.body;
  if (!staffCode || !date || !maphep || ton == null) {
    return res.status(400).json({ status: false, message: 'Missing required fields' });
  }
  const result = await dboperation.addAL(staffCode, date, maphep, phongban, bophan, ton);
  res.json(result);
});

module.exports = router;
