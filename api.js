const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const logger = require('./logger');

const app = express();

// Middleware
app.use(cors());
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

// Log every request
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// Import Routes
const staffRoutes = require('./routes/staffRoute');
const shiftRoutes = require('./routes/shiftRoute');
const machineTimeRoutes = require('./routes/machineTimeRoute');

// Register routes
app.use('/api/staff', staffRoutes);
app.use('/api/shift', shiftRoutes);
app.use('/api/machine_time',machineTimeRoutes);

// Home route
app.get('/api/home', (req, res) => {
  logger.info('Home roster APIs accessed');
  res.json('Home Roster Staff Vegas APIs');
});

// Start server
const port = process.env.PORT || 8090;
app.listen(port, () => {
  console.log(`✅ VegasConnect API running at port ${port}`);
  logger.info(`Server started at port ${port}`);
});
