'use strict';

const path = require('path');
const AutoLoad = require('fastify-autoload');
const fastify = require('fastify')({
  logger: false
});

fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'services')
});

fastify.listen(3000);