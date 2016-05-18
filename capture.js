var phantom = require('phantom');
var path = require('path');
var fs = require('fs');
var async = require('async');
var currentWeekNumber = require('current-week-number');
var _ph, _page, _outObj;

var winston = require('winston');
winston.add(winston.transports.File, { filename: 'capture.log' });

var DIR = 'captures';
var USERNAME = 'testuser';
var PASSWORD = 'letstest!?';

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
  phantom.create().then(ph => {
      _ph = ph;
      return _ph.createPage();
  }).then(page => {
      _page = page;
      _page.setting('resourceTimeout', 30000);

      if (item.device === 'mobile') {
        _page.property('viewportSize', {width: 480, height: 640});
      } else if (item.device === 'tablet') {
        _page.property('viewportSize', {width: 1024, height: 800});
      } else {
        _page.property('viewportSize', {width: 1920, height: 1080});
      }

      if (item.auth) {
        _page.setting('userName', USERNAME);
        _page.setting('password', PASSWORD);
      }

      return _page.open(item.url);
  }).then(status => {
      winston.info(item.url, status);
      return _page.property('content');
  }).then(content => {
      setTimeout(function() {
        _page.render(getFilename(item), {format: 'jpeg', quality: '95'});
        _page.close();
        _ph.exit();
        cb();
      }, item.delay);
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

  return path.join(DIR, item.device, filename, filename + '_' + 'KW' + currentWeekNumber() + '_' + new Date().getFullYear() + '_' + item.delay + '.jpeg');
}

module.exports = {
	run: run
};
