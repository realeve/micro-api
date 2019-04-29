'use strict';

const path = require('path');
const AutoLoad = require('fastify-autoload');
const helmet = require('fastify-helmet');
const { mysql: config } = require('./util/db');
const fastify = require('fastify')({
  ignoreTrailingSlash: true
  // logger: false
});

// cors
fastify.register(require('fastify-cors'), {
  origin: [/localhost(:\d+)$/, /127\.0\.0\.1(:\d+)$/],
  methods: ['GET', 'OPTIONS', 'POST']
});

// gzip
fastify.register(require('fastify-compression'), { threshold: 1024 });

// 防爬虫，分钟数请求限制
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

// MYSQL
fastify.register(require('fastify-mysql'), {
  promise: true,
  connectionString: `mysql://${config.user}:${config.password}@${config.host}:${
    config.port
  }/${config.database}`
});

// 自动加载路由
fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'services')
});

fastify.register(
  helmet,
  // Example of passing an option to x-powered-by middleware
  {
    hidePoweredBy: { setTo: 'PHP 4.2.0' },
    referrerPolicy: { policy: 'origin' }
  }
);

fastify.listen(3000, '0.0.0.0', (err, address) => {
  if (err) throw err;
  fastify.log.info(`server listening on ${address}`);
});
