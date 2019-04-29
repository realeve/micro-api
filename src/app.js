'use strict';

const path = require('path');
const AutoLoad = require('fastify-autoload');
const { mysql: config } = require('./util/db');
const fastify = require('fastify')({
  ignoreTrailingSlash: true
  // logger: false
});

// 超时限制
fastify.register(require('fastify-rate-limit'), {
  max: 200, // default 1000
  timeWindow: 60 * 1000, // default 1000 * 60
  cache: 5000, // default 5000
  whitelist: ['127.0.0.1'], // default []
  // redis: new Redis({ host: '127.0.0.1' }), // default null
  skipOnError: true, // default false
  keyGenerator: function(req) {
    return (
      req.headers['x-real-ip'] || // nginx
      req.headers['x-client-ip'] || // apache
      req.raw.ip
    ); // fallback to default
  }
});

fastify.register(require('fastify-mysql'), {
  promise: true,
  connectionString: `mysql://${config.user}:${config.password}@${config.host}:${
    config.port
  }/${config.database}`
});

fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'services')
});

// fastify.register(require('fastify-response-time'));

fastify.listen(3000, '0.0.0.0', (err, address) => {
  if (err) throw err;
  fastify.log.info(`server listening on ${address}`);
});
