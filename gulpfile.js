var config = require('./config.json');
var gulp  = require('gulp');
var capture = require('./capture');

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
  gulp.watch('./**/' + config.downloadDir + '/**/*', function(e) {
    if (e.type === 'deleted') {
      // TODO gulp.run will be deprecated with 4.0.0
      gulp.run('update');
    }
  });
});
