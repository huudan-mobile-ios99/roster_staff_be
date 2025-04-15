// api.js
const dboperation = require('./dboperation');
const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const router = express.Router();
//logger
const logger = require('./logger'); // Import Winston logger

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(cors());
app.use('/api', router);

router.use((request, response, next) => {
    console.log('Middleware activated');
    logger.info('Middleware activated'); // Use Winston logger
    next();
});

const port = process.env.PORT || 8090;
app.listen(port, () => {
    console.log(`App running at port: ${port}`);
});

// Staff schedule endpoint
router.route('/staff_schedule_list').post((request, response) => {
    const { startDate, endDate } = request.body; // Extract startDate and endDate from request body
    // Validate input
    if (!startDate || !endDate) {
        logger.warn('Missing startDate or endDate in request body');
        return response.status(400).json({ error: 'startDate and endDate are required' });
    }
    // Validate date format (e.g., MM/DD/YYYY)
    const dateFormatRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dateFormatRegex.test(startDate) || !dateFormatRegex.test(endDate)) {
        logger.warn(`Invalid date format: startDate=${startDate}, endDate=${endDate}`);
        return response.status(400).json({ error: 'Dates must be in MM/DD/YYYY format' });
    }
    dboperation.listStaffScheduleAll(startDate, endDate, (err, result) => {
        if (err) {
            logger.error(`Error in listStaffScheduleAll: ${err}`);
            return response.status(500).json({ error: 'Failed to fetch staff schedule' });
        }
        response.json(result);
    });
});

// Home endpoint
router.route('/home').get((request, response) => {
    console.log('Home roster APIs accessed');
    logger.info(`Home roster APIs accessed`); // Use Winston logger
    response.json('Home Roster Staff Vegas APIs');
});
