var gulp  = require('gulp');

gulp.task('update', function() {

});

gulp.task('watch', function() {
  gulp.watch('capture/**/config.csv', ['update']);
});
