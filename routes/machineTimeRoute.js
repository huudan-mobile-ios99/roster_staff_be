// routes/staffLeave.js
const express = require('express');
const router = express.Router();
const dboperation = require('../dboperation');

// GET all time machine records (latest first)
// GET time machine records — pagination with minimal info
router.get('/list', async (req, res) => {
  try {
    let { page = 1, limit = 50 } = req.query;
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (page - 1) * limit;
    const { records } = await dboperation.getTimeMachineRecords({ limit, offset });

    return res.json({
      status: true,
      message: `Successfully fetched time machine records, page${page} of results (limit: ${limit})`,
      data: records
    });

  } catch (error) {
    console.error("Error fetching time machine records:", error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch time machine records',
      data: null
    });
  }
});


router.post('/add', async (req, res) => {
  const { id_number, date, time, in_out } = req.body;

  // Validate required fields
  if (!id_number || !date || !time || in_out === undefined) {
    return res.status(400).json({
      status: false,
      message: 'Missing required fields: id_number, date, time, in_out',
      data: null,
    });
  }

  try {
    const insertedRecord = await dboperation.addTimeRecord({
      id_number: id_number.toString().trim(),  // ← trim spaces
      date,
      time,
      in_out: parseInt(in_out, 10)
    });

    return res.json({
      status: true,
      message: 'Time record added successfully',
      data: insertedRecord
    });

  } catch (error) {
    // Handle duplicate record (from UNIQUE constraint)
    if (error.message === 'DUPLICATE_RECORD') {
      return res.status(409).json({
        status: false,
        message: 'This clock-in/out already exists for this staff on this date & time',
        data: null
      });
    }

    console.error("Error adding time record:", error);
    return res.status(500).json({
      status: false,
      message: 'Failed to add record',
      data: null
    });
  }
}); 

// ✏️ Edit Shift
// PUT: Edit a time record by readers + id_number
router.put('/edit', async (req, res) => {
  const { readers, id_number, date, time, in_out } = req.body;

  // Required fields
  if (!readers || !id_number || !date || !time || in_out === undefined) {
    return res.status(400).json({
      status: false,
      message: 'Missing required fields: readers, id_number, date, time, in_out',
      data:null,
    });
  }

  try {
    const updatedRecord = await dboperation.updateTimeRecordByIdAndStaff({
      readers: parseInt(readers, 10),
      id_number: id_number.trim(),  // Clean whitespace
      date,
      time,
      in_out
    });

    if (!updatedRecord) {
      return res.status(404).json({
        status: false,
        message: 'Record not found with the given readers and id_number',
        data:null,
      });
    }

    return res.json({
      status: true,
      message: 'Time record updated successfully',
      data: updatedRecord
    });

  } catch (error) {
    console.error("Error updating time record:", error);
    return res.status(500).json({
      status: false,
      message: 'Failed to update record',
      data:null
    });
  }
});




// DELETE: Delete a time record by readers + id_number
router.delete('/delete', async (req, res) => {
  const { readers, id_number } = req.body;
  // Validate required fields
  if (!readers || !id_number) {
    return res.status(400).json({
      status: false,
      message: 'Missing required fields: readers and id_number',
      data:null,
    });
  }
  try {
    const deletedRecord = await dboperation.deleteTimeRecord({
      readers: parseInt(readers, 10),
      id_number: id_number.trim()
    });
    if (!deletedRecord) {
      return res.status(404).json({
        status: false,
        message: 'Record not found with the given readers and id_number',
        data:null,
      });
    }
    return res.json({
      status: true,
      message: 'Time record deleted successfully',
      data: deletedRecord  // Return the deleted record for confirmation
    });

  } catch (error) {
    console.error("Error deleting time record:", error);
    return res.status(500).json({
      status: false,
      message: 'Failed to delete record',
      data:null,
    });
  }
});

module.exports = router;


