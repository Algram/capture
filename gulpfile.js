var gulp  = require('gulp');

gulp.task('update', function() {
  console.log('got updated config');
});

gulp.task('watch', function() {
  gulp.watch('./**/config.csv', ['update']);
});
