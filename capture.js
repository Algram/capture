const config = require('./config.json');
const phantom = require('phantom');
const path = require('path');
const fs = require('fs');
const async = require('async');
const currentWeekNumber = require('current-week-number');
const sanitize = require('sanitize-filename');


/**
 * Delivers a relative path to a custom named file. The path is based on the
 * item itself and information from the config file
 * @param  {object} item Object based on the converted csv file
 * @return {string}      Concatenated path
 */
function getFilename(item) {
  const filename = sanitize(item.url
    .replace(/http:/g, '')
    .replace(/https:/g, '')
  );

  return path.join(
    config.downloadDir,
    item.device,
    filename,
    `${filename}_KW${currentWeekNumber()}_${new Date().getFullYear()}_${item.delay}.${config.images.format}` // eslint-disable max-len
  );
}

/**
 * This captures a website with the help of phantomjs. It sets various things
 * from the config file and saves the rendered website image to a given
 * file path
 * @param  {object}   item Object based on the converted csv file
 * @param  {Function} cb   callback
 */
function capture(item, cb) {
  let conn;
  let page;
  const params = [];

  params.push(`--proxy=${config.proxy.address}`);
  params.push(`--proxy-auth=${config.proxy.username}:${config.proxy.password}`);
  params.push('--ignore-ssl-errors=true');

  phantom.create(params)
  .then(connection => {
    conn = connection;
    return conn.createPage();
  })
  .then(webpage => {
    page = webpage;
    page.setting('resourceTimeout', config.resourceTimeout);

    // Set screen sizes based on the config
    if (item.device === 'mobile') {
      page.setting('userAgent', config.userAgents.mobile);
      page.property('viewportSize', {
        width: config.dimensions.mobile.w,
        height: config.dimensions.mobile.h
      });
    } else if (item.device === 'tablet') {
      page.setting('userAgent', config.userAgents.tablet);
      page.property('viewportSize', {
        width: config.dimensions.tablet.w,
        height: config.dimensions.tablet.h
      });
    } else {
      page.setting('userAgent', config.userAgents.desktop);
      page.property('viewportSize', {
        width: config.dimensions.desktop.w,
        height: config.dimensions.desktop.h
      });
    }

    return page.open(item.url);
  })
  .then(status => {
    winston.info(item.url, item.device, item.delay, status);

    if (status === 'success') {
      // Set the delay to call the rendering process
      setTimeout(() => {
        page.render(getFilename(item), {
          format: config.images.format,
          quality: config.images.quality
        });
        page.close();
        conn.exit();
        cb();
      }, (item.delay > config.maxDelay) ? config.maxDelay : item.delay);
    } else {
      page.close();
      conn.exit();
      cb();
    }
  });
}

/**
 * Check if a file exists through a path
 * @param  {string}   filename Relative path to file
 * @param  {Function} cb       callback with a boolean
 */
function exists(filename, cb) {
  fs.access(filename, fs.F_OK, (err) => {
    if (!err) {
      cb(true);
    } else {
      cb(false);
    }
  });
}

/**
 * Takes an objected based on a csv file and starts the capturing process if
 * the file doesn't exist already. The execution process is handled by async
 * in series
 * @param  {object} data Object based on the converted csv file
 */
function run(data) {
  async.eachSeries(data, (item, cb) => {
    const filename = getFilename(item);

    // Check if the file exists already
    exists(filename, (doesExist) => {
      if (!doesExist) {
        capture(item, cb);
      } else {
        winston.info('File %s exists already', filename);
        cb();
      }
    });
  }, error => {
    if (error) {
      winston.error(error);
    } else {
      winston.info('All files processed.');
    }
  });
}

module.exports = {
  run
};
