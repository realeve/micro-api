'use strict';

module.exports = function(fastify, _, next) {
  fastify.get('/', function(_, reply) {
    reply.send('{"foo":"bar"}');
  });
  next();
};
