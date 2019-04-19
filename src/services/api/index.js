'use strict';

module.exports = function(fastify, _, next) {
  fastify.get('/api', function(_, reply) {
    reply.send({
      status: 200
    });
  });
  next();
};
