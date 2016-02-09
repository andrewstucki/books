var kue = require('kue');
var config = require('./config');
var queue = kue.createQueue({
  redis: config.redis
});

module.exports = queue;
