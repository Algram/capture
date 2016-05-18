var gulp  = require('gulp');

gulp.task('update', function() {
  console.log('got updated config');
  //Converter Class
  var Converter = require("csvtojson").Converter;
  var converter = new Converter({});
  converter.fromFile("./config.csv",function(err,result){
    console.log(result);
  });
});

gulp.task('watch', function() {
  gulp.watch('./**/config.csv', ['update']);
});
