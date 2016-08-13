const config = require('./config.json');
const capture = require('./capture');
const gulp = require('gulp');
const watch = require('gulp-watch');
const path = require('path');

gulp.task('update', () => {
  console.log('got updated config, running capture..');

  // Converter Class
  const Converter = require("csvtojson").Converter;
  const converter = new Converter({ignoreEmpty: true});
  converter.fromFile(path.join(config.downloadDir, 'config.csv'), (err, result) => {
    capture.run(result);
  });
});

gulp.task('watch', () => {
  gulp.watch(path.join(config.downloadDir, 'config.csv'), ['update']);

  // Enable usePolling on network drives. This leads to higher cpu usage
  watch(path.join(config.downloadDir, '/**/*'), {events: ["unlink"], usePolling: true}, function(e) {
    gulp.run('update');
  });
});
