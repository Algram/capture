var config = require('./config.json');
var phantom = require('phantom');
var path = require('path');
var fs = require('fs');
var async = require('async');
var currentWeekNumber = require('current-week-number');
var winston = require('winston');

// Add logfile transport to winston
winston.add(winston.transports.File, {
  filename: path.join(config.logDir, 'capture.log')
});

/**
 * Takes an objected based on a csv file and starts the capturing process if
 * the file doesn't exist already. The execution process is handled by async
 * in series
 * @param  {object} data Object based on the converted csv file
 */
function run(data) {
  async.eachSeries(data, function(item, cb) {
    var filename = getFilename(item);

    // Check if the file exists already
    exists(filename, function(doesExist) {
      if (!doesExist) {
        capture(item, function() {
          cb();
        });
      } else {
        winston.info('File %s exists already', filename);
        cb();
      }
    });
  }, function(error) {
    if (error) {
      winston.error(error);
    } else {
      winston.info('All files processed.');
    }
  });
}

/**
 * This captures a website with the help of phantomjs. It sets various things
 * from the config file and saves the rendered website image to a given
 * file path
 * @param  {object}   item Object based on the converted csv file
 * @param  {Function} cb   callback
 */
function capture(item, cb) {
  var _ph, _page, _outObj;

  phantom.create().then(ph => {
    if (config.proxy !== undefined) {
      phantom.setProxy(config.proxy);
    }

    _ph = ph;
    return _ph.createPage();
  }).then(page => {
    _page = page;
    _page.setting('resourceTimeout', config.resourceTimeout);

    // Set screen sizes based on the config
    if (item.device === 'mobile') {
      _page.setting('userAgent', 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19');
      _page.property('viewportSize', {
        width: config.dimensions.mobile.w,
        height: config.dimensions.mobile.h
      });
    } else if (item.device === 'tablet') {
      _page.setting('userAgent', 'Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53');
      _page.property('viewportSize', {
        width: config.dimensions.tablet.w,
        height: config.dimensions.tablet.h
      });
    } else {
      _page.setting('userAgent', 'Mozilla/5.0 (Windows NT 6.4; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2225.0 Safari/537.36');
      _page.property('viewportSize', {
        width: config.dimensions.desktop.w,
        height: config.dimensions.desktop.h
      });
    }

    return _page.open(item.url);
  }).then(status => {
    winston.info(item.url, item.device, item.delay, status);

    if (status === 'success') {
      // Set the delay to call the rendering process
      setTimeout(function() {
        _page.render(getFilename(item), {
          format: config.images.format,
          quality: config.images.quality
        });
        _page.close();
        _ph.exit();
        cb();
      }, (item.delay > config.maxDelay) ? config.maxDelay : item.delay);
    } else {
      _page.close();
      _ph.exit();
      cb();
    }
  });
}

/**
 * Check if a file exists through a path
 * @param  {string}   filename Relative path to file
 * @param  {Function} cb       callback with a boolean
 */
function exists(filename, cb) {
  fs.access(filename, fs.F_OK, (err) => {
    if (!err) {
      cb(true);
    } else {
      cb(false);
    }
  });
}

/**
 * Delivers a relative path to a custom named file. The path is based on the
 * item itself and information from the config file
 * @param  {object} item Object based on the converted csv file
 * @return {string}      Concatenated path
 */
function getFilename(item) {
  var filename = item.url.replace(/\//g, '');
  filename = filename.replace(/http:/g, '');
  filename = filename.replace(/https:/g, '');

  return path.join(config.downloadDir, 'images', item.device, filename, filename + '_' + 'KW' + currentWeekNumber() + '_' + new Date().getFullYear() + '_' + item.delay + '.' + config.images.format);
}

module.exports = {
  run: run
};
