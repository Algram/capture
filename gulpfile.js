var config = require('./config.json');
var capture = require('./capture');
var gulp  = require('gulp');
var watch = require('gulp-watch');
var path = require('path');

gulp.task('update', function() {
  console.log('got updated config, running capture..');
  //Converter Class
  var Converter = require("csvtojson").Converter;
  var converter = new Converter({});
  converter.fromFile(path.join(config.downloadDir, 'config.csv'), function(err, result){
    capture.run(result);
  });
});

gulp.task('watch', function() {
  gulp.watch(path.join(config.downloadDir, 'config.csv'), ['update']);
  watch(config.downloadDir + '/**/*', {events: ["unlink"]}, function(e) {
    gulp.run('update');
  });
});
