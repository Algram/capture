var config = require('./config.json');
var phantom = require('phantom');
var path = require('path');
var fs = require('fs');
var async = require('async');
var currentWeekNumber = require('current-week-number');
var winston = require('winston');

winston.add(winston.transports.File, {filename: path.join(config.logDir, 'capture.log')});

function run(data) {
  async.eachSeries(data, function(item, cb) {
    var filename = getFilename(item);
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
  },function(error) {
    if (error) {
      winston.error(error);
    } else {
      winston.info('All files processed.');
    }
  });
}

function capture(item, cb) {
  var _ph, _page, _outObj;

  phantom.create().then(ph => {
      _ph = ph;
      return _ph.createPage();
  }).then(page => {
      _page = page;
      _page.setting('resourceTimeout', config.resourceTimeout);

      if (item.device === 'mobile') {
        _page.property('viewportSize', {width: config.dimensions.mobile.w, height: config.dimensions.mobile.h});
      } else if (item.device === 'tablet') {
        _page.property('viewportSize', {width: config.dimensions.tablet.w, height: config.dimensions.tablet.h});
      } else {
        _page.property('viewportSize', {width: config.dimensions.desktop.w, height: config.dimensions.desktop.h});
      }

      if (item.auth) {
        _page.setting('userName', config.username);
        _page.setting('password', config.password);
      }

      return _page.open(item.url);
  }).then(status => {
      winston.info(item.url, status);

      if (status === 'success') {
        setTimeout(function() {
          _page.render(getFilename(item), {format: config.images.format, quality: config.images.quality});
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

function exists(filename, cb) {
  fs.access(filename, fs.F_OK, (err) => {
    if (!err) {
      cb(true);
    } else {
      cb(false);
    }
  });
}

function getFilename(item) {
  var filename = item.url.replace(/\//g, '');
  filename = filename.replace(/http:/g, '');
  filename = filename.replace(/https:/g, '');

  return path.join(config.downloadDir, item.device, filename, filename + '_' + 'KW' + currentWeekNumber() + '_' + new Date().getFullYear() + '_' + item.delay + '.' + config.images.format);
}

module.exports = {
	run: run
};
