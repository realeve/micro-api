'use strict';

module.exports = function(fastify, opts, next) {
  fastify.get('/', function(request, reply) {
    reply.send({ foo: 'bar' });
  });
  next();
};
