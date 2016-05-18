var phantom = require('phantom');
var path = require('path');
var async = require('async');
var currentWeekNumber = require('current-week-number');
var _ph, _page, _outObj;

var DIR = 'captures';
var data;

//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
converter.fromFile("./config.csv",function(err,result){
  data = result;
  start();
});

function start() {
  async.eachSeries(data, function(item, cb) {
    capture(item, function() {
      cb();
    });
  },function(e) {
    if (e) console.log(e);
    console.log('done');
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
      console.log(status);
      return _page.property('content');
  }).then(content => {
      var filename = item.url.replace(/\//g, '');
      filename = filename.replace(/http:/g, '');
      filename = filename.replace(/https:/g, '');
      //filename = filename.replace(/\./g, '');
      //filename = filename.replace(/-/g, '');
      console.log(filename );

      setTimeout(function() {
        _page.render(path.join(DIR, item.device, filename, filename + '_' + 'KW' + currentWeekNumber() + '_' + new Date().getFullYear() + '_' + item.delay + '.jpeg'), {format: 'jpeg', quality: '95'});
        _page.close();
        _ph.exit();
        cb();
      }, item.delay);
  });
}
