'use strict';

const path = require('path');
const AutoLoad = require('fastify-autoload');
const { mysql: config } = require('./util/db');
const fastify = require('fastify')({
  logger: false
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

fastify.listen(3000, '0:0:0:0', (err, address) => {
  if (err) throw err;
  fastify.log.info(`server listening on ${address}`);
});
