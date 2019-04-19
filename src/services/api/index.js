'use strict';
const R = require('ramda');
const lib = require('../../util/lib');

module.exports = function(fastify, _, next) {

    const callback = async function(req, reply) {
        let data = await lib.handleReq({
            query: req.params
        }, fastify);
        reply.send(data);
    }

    // http://127.0.0.1:3000/api?id=a&nonce=2&cache=4
    fastify.get('/api', async function(req, reply) {
        let data = await lib.handleReq(req, fastify);
        reply.send(data);
    });

    fastify.get('/api/:id/:nonce/:cache', callback);

    fastify.get('/api/:id/:nonce', callback);

    next();
};