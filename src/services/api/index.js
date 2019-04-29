'use strict';
const lib = require('../../util/lib');
const { opts, queryStringJsonSchema, handleErr } = require('../../util/schema');
const Youch = require('youch');
const throwErrHtml = (err, req, reply) => {
  if (err && process.env.NODE_ENV !== 'production') {
    const youch = new Youch(err, req);
    youch
      .addLink(({ message }) => {
        const url = `https://stackoverflow.com/search?q=${encodeURIComponent(
          message
        )}`;
        return `<a href="${url}" class="error-name" target="_blank" title="在 stackoverflow 搜索">在 stackoverflow 搜索解决方案</a>`;
      })
      .toHTML()
      .then((html) => {
        reply.header('content-type', 'text/html').send(html);
      });
  }
};
module.exports = function(fastify, _, next) {
  const handleData = async (req, reply, query) => {
    let data = await lib
      .handleReq(
        {
          ...req,
          query
        },
        fastify
      )
      .catch((err) => throwErrHtml(err, req, reply));
    handleErr(data, reply, req);
  };

  const postCallback = function(req, reply) {
    let query = Object.assign(req.query, req.body);
    handleData(req, reply, query);
  };

  // 经测，使用schema后，rqs从6200降至不足3000，此处关闭，在应用层自定义校验
  fastify.post(
    '/api',
    {
      schema: {
        body: queryStringJsonSchema
      }
    },
    postCallback
  );

  // http://127.0.0.1:3000/api?id=a&nonce=2&cache=4
  fastify.get(
    '/api',
    {
      schema: {
        querystring: queryStringJsonSchema
      }
    },
    async function(req, reply) {
      req.query.cache = (req.query.cache || 0) * 60;
      let data = await lib
        .handleReq(req, fastify)
        .catch((err) => throwErrHtml(err, req, reply));
      handleErr(data, reply);
    }
  );

  fastify.get(
    '/api/:id/:nonce',
    {
      schema: {
        params: queryStringJsonSchema
      }
    },
    function(req, reply) {
      req.query.cache = (req.query.cache || 0) * 60;
      let query = Object.assign(req.query, req.params);
      handleData(req, reply, query);
    }
  );
  // opts,
  fastify.get('/api/:id/:nonce/:__cache', opts, function(req, reply) {
    let cache = req.params.__cache;
    if (['array', 'json'].includes(cache)) {
      req.query.mode = cache;
      req.query.cache = (req.query.cache || 0) * 60;
    } else {
      req.query.mode = 'json';
      req.query.cache = (cache || 0) * 60;
    }

    let query = Object.assign(req.query, req.params);
    handleData(req, reply, query);
  });

  next();
};
