const config = require('./config.json');
const logger = require('./logger');
const capture = require('./capture');
const gulp = require('gulp');
const watch = require('gulp-watch');
const path = require('path');
const Converter = require('csvtojson').Converter;

gulp.task('update', () => {
  logger.info('got updated config, parsing config.csv..');

  // Converter Class
  const converter = new Converter({ ignoreEmpty: true });
  converter.fromFile(path.join(config.downloadDir, 'config.csv'), (err, result) => {
    if (err) {
      logger.error(err);
    } else {
      logger.info('parsing successful, running capture..');
      capture.run(result);
    }
  });
});

gulp.task('watch', () => {
  gulp.watch(path.join(config.downloadDir, 'config.csv'), ['update']);

  // Enable usePolling on network drives. This leads to higher cpu usage
  watch(path.join(config.downloadDir, '/**/*'), { events: ['unlink'], usePolling: true }, () => {
    gulp.run('update');
  });
});
