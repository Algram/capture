const config = require('./config.json');
const capture = require('./capture');
const gulp = require('gulp');
const watch = require('gulp-watch');
const path = require('path');

gulp.task('update', () => {
  console.log('got updated config, running capture..');

  // Converter Class
  const Converter = require("csvtojson").Converter;
  const converter = new Converter({});
  converter.fromFile(path.join(config.downloadDir, 'config.csv'), (err, result) => {
    capture.run(result);
  });
});

gulp.task('watch', () => {
  gulp.watch(path.join(config.downloadDir, 'config.csv'), ['update']);
  watch(`${config.downloadDir}/**/*`, { events: ['unlink'] }, () => {
    gulp.run('update');
  });
});
