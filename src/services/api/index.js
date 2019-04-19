'use strict';
const {
    promisify
} = require('util');
const R = require('ramda');
const lib = require('../../util/lib');

// redis-cli -p 6379 -a redis
// config set requirepass redis
// config get requirepass
const redis = require('redis').createClient({
    // password: 'redis',
    host: '127.0.0.1',
    port: 6379
});

// const { redis } = fastify;
const getCache = promisify(redis.get).bind(redis);
const setCache = (key, value, time = 0) => {
    redis.set(key, JSON.stringify(value), 'EX', time === 0 ? time : 60 * 60 * 24);
};

const handleReq = async req => {
    let key = lib.getKey(req.query);
    let data = key ? await getCache(key) : null;
    let {
        cache,
        format
    } = lib.getDataFormat(req.query);

    if (R.isNil(data)) {
        let result = {
            hello: 'world'
        };
        let redisRes = {
            data: result,
            cache: {
                date: lib.now(),
                expires: lib.future(cache),
                cache,
                from: 'redis'
            },
            key
        };
        setCache(key, redisRes, 60);
        data = Object.assign(redisRes, {
            cache: {
                from: 'database'
            }
        });
    }
    return data;
}

module.exports = function(fastify, _, next) {
    // http://127.0.0.1:3000/api?id=a&nonce=2&cache=4
    fastify.get('/api', async function(req, reply) {
        let data = await handleReq(req);
        reply.send(data);
    });

    fastify.get('/api/:id/:nonce/:cache', async function(req, reply) {
        let data = await handleReq({
            query: req.params
        });
        reply.send(data);
    });

    fastify.get('/api/:id/:nonce', async function(req, reply) {
        let data = await handleReq({
            query: req.params
        });
        reply.send(data);
    });

    next();
};