'use strict';
const lib = require('../../util/lib');
const {
    opts,
    queryStringJsonSchema,
    handleErr,
} = require('../../util/schema');

module.exports = function(fastify, _, next) {
    const handleData = async(req, reply, query) => {
        let data = await lib.handleReq({
                ...req,
                query
            },
            fastify
        )
        if (typeof data === 'string') {
            reply.send(data);
        }
        handleErr(data, reply);
    };

    const callback = function(req, reply) {
        if (req.params.__cache) {
            if (['array', 'json'].includes(req.params.__cache)) {
                req.query.mode = req.params.__cache;
                req.query.cache = Number(req.query.cache || 0) * 60;
            } else {
                req.query.mode = 'json';
                req.query.cache = Number(req.params.__cache || 0) * 60;
            }
            Reflect.deleteProperty(req.params, '__cache');
        } else {
            req.query.cache = Number(req.query.cache || 0) * 60;
            req.query.mode = req.query.mode || 'json';
        }

        let query = Object.assign(req.query, req.params);
        handleData(req, reply, query)
    };
    const postCallback = function(req, reply) {
        let query = Object.assign(req.query, req.body);
        handleData(req, reply, query)
    };

    // 经测，使用schema后，rqs从6200降至不足3000，此处关闭，在应用层自定义校验
    fastify.post(
        '/api',
        //  {
        //     schema: {
        //         body: queryStringJsonSchema
        //     }
        // },
        postCallback
    );

    // http://127.0.0.1:3000/api?id=a&nonce=2&cache=4
    fastify.get(
        '/api',
        //  {
        //     schema: {
        //         querystring: queryStringJsonSchema
        //     }
        // },
        async function(req, reply) {
            req.query.cache = Number(req.query.cache || 0) * 60;
            let data = await lib.handleReq(req, fastify);
            handleErr(data, reply);
        }
    );

    fastify.get('/api/:id/:nonce',
        //  {
        //     schema: {
        //         params: queryStringJsonSchema
        //     }
        // }, 
        callback);
    // opts,
    fastify.get('/api/:id/:nonce/:__cache', callback);

    next();
};