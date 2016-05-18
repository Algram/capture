var phantom = require('phantom');
var path = require('path');
var fs = require('fs');
var async = require('async');
var currentWeekNumber = require('current-week-number');
var _ph, _page, _outObj;

var winston = require('winston');
winston.add(winston.transports.File, { filename: 'capture.log' });

var DIR = 'captures';

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

      if (item.device === 'mobile') {
        //_page.setting('userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25');
        _page.property('viewportSize', {width: 480, height: 640});
      } else if (item.device === 'tablet') {
        _page.property('viewportSize', {width: 1024, height: 800});
      } else {
        //_page.setting('userAgent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
        _page.property('viewportSize', {width: 1920, height: 1080});
      }

      if (item.auth) {
        _page.setting('userName', 'testuser');
        _page.setting('password', 'letstest!?');
      }

      return _page.open(item.url);
  }).then(status => {
      winston.info(item.url, status)
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
}
