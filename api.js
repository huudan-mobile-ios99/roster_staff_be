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
router.route('/staff_schedule_list').get((request, response) => {
    dboperation.listStaffScheduleAll((err, result) => {
        if (err) {
            console.error(`Error in listStaffScheduleAll: ${err}`);
            logger.error(`Error in listStaffScheduleAll: ${err}`); // Use Winston logger
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
