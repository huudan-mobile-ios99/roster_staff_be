// routes/staffLeave.js
const express = require('express');
const router = express.Router();
const dboperation = require('../dboperation');
// ✅ GET /api/staff_leave?staffCode=0165&start=2025-11-01&end=2025-11-03
// ➕ Add Shift
router.post('/add', async (req, res) => {
  const data = req.body;
  const { staffCode, date, shiftName, department, division} = data;

  // Required field validation
  if (!staffCode || !date || !shiftName || !department || !division  ) {
    return res.status(400).json({
      status: false,
      message: 'staffCode, date, shiftName, department, and division are required fields',
      data
    });
  }

  const result = await dboperation.addShift(data);
  res.json(result);
});


// ✏️ Edit Shift
router.put('/edit', async (req, res) => {
  const data = req.body;
  const { staffCode, date } = data;

  // staffCode & date are required for finding the record
  if (!staffCode || !date) {
    return res.status(400).json({
      status: false,
      message: 'staffCode and date are required fields',
      data
    });
  }

  // Map English fields to database fields before calling dboperation
  const mappedData = {
    manv: staffCode,
    ngay: date,
    maca: data.shiftName,
    ghichu: data.note,
    capnhat_vg: data.syncVG
  };

  const result = await dboperation.editShift(mappedData);
  res.json(result);
});


// 📋 Get list of shifts by staffCode
router.get('/list/:staffCode', async (req, res) => {
  const { staffCode } = req.params;

  if (!staffCode) {
    return res.status(400).json({
      status: false,
      message: 'staffCode is required',
      data: []
    });
  }

  const result = await dboperation.getShiftsByStaffCode(staffCode);
  res.json(result);
});



module.exports = router;


