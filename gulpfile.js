var config = require('./config.json');
var capture = require('./capture');
var gulp  = require('gulp');
var watch = require('gulp-watch');

gulp.task('update', function() {
  console.log('got updated config, running capture..');
  //Converter Class
  var Converter = require("csvtojson").Converter;
  var converter = new Converter({});
  converter.fromFile("./config.csv", function(err, result){
    capture.run(result);
  });
});

gulp.task('watch', function() {
  gulp.watch('./**/config.csv', ['update']);
  watch('./**/' + config.downloadDir + '/**/*', {events: ["unlink"]}, function(e) {
    gulp.run('update');
  });
});
