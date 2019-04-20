'use strict';
const R = require('ramda');
const lib = require('../../util/lib');

module.exports = function(fastify, _, next) {
  const handleErr = ({ status, msg, ...data }, reply) => {
    if (status == 200) {
      reply.send(data);
      return;
    }
    const err = new Error();
    err.statusCode = status;
    err.message = msg;
    throw err;
  };
  const callback = async function(req, reply) {
    if (req.params.__cache) {
      if (['array', 'json'].includes(req.params.__cache)) {
        req.query.mode = req.params.__cache;
        req.query.cache = req.query.cache || 0;
      } else {
        req.query.mode = 'json';
        req.query.cache = Number(req.params.__cache) * 60;
      }
      Reflect.deleteProperty(req.params, '__cache');
    } else {
      req.query.mode = 'json';
    }

    let query = Object.assign(req.query, req.params);

    let data = await lib.handleReq(
      {
        ...req,
        query
      },
      fastify
    );
    handleErr(data, reply);
  };

  // http://127.0.0.1:3000/api?id=a&nonce=2&cache=4
  fastify.get('/api', async function(req, reply) {
    let data = await lib.handleReq(req, fastify);
    handleErr(data, reply);
  });

  fastify.get('/api/:id/:nonce/:__cache', callback);

  fastify.get('/api/:id/:nonce', callback);

  next();
};
