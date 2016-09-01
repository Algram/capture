const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

if (!fs.existsSync(config.logDir) && config.logDir !== '') {
  // Create the directory if it does not exist
  fs.mkdirSync(config.logDir);
}

// Add logfile transport to winston
winston.add(winston.transports.File, {
  filename: path.join(config.logDir, 'capture.log')
});

winston.remove(winston.transports.Console);

module.exports = winston;
