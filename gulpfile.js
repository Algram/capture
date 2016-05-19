var config = require('./config.json');
var gulp  = require('gulp');
var capture = require('./capture');

gulp.task('update', function() {
  console.log('got updated config, running capture..');
  //Converter Class
  var Converter = require("csvtojson").Converter;
  var converter = new Converter({});
  converter.fromFile("./config.csv",function(err, result){
    capture.run(result);
  });
});

gulp.task('watch', function() {
  gulp.watch('./**/config.csv', ['update']);
});
