const etag = require('etag');
// https://github.com/fastify/docs-chinese/blob/master/docs/Validation-and-Serialization.md
// 使用序列化参数提高性能
const queryStringJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nonce: { type: 'string', maxLength: 10, minLength: 10 },
    cache: { type: 'number' },
    mode: { type: 'string', enum: ['array', 'json'] }
  },
  required: ['id', 'nonce']
};

let paramSchema = {
  type: 'object',
  properties: {
    cache: { type: 'number' },
    mode: { type: 'string', enum: ['array', 'json'] }
  }
};
const paramsJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nonce: { type: 'string', maxLength: 10, minLength: 10 },
    __cache: { type: ['string', 'number'] } //enum: ['array', 'json']
  },
  required: ['id', 'nonce', '__cache']
};

const handleStatus = ({ status = 200, error, msg, ...data }, reply, req) => {
  if (status > 299) {
    reply.code(status).send({ statusCode: status, error, message: msg });
    return;
  }
  let { cache } = data;

  handleCache(cache, data, reply, req, status);
  // http协议缓存处理,参考：https://hapijs.com/tutorials/caching?lang=en_US
  if (cache.cache) {
    return;
  }
  reply.send(data);
};

// cache test:http://localhost:3000/api/85/579209ce04/0.2
// 缓存策略更新完毕，跨域请求options不再请求，ajax动态请求在缓存期内返回200(from disk cache)，F5刷新返回304(Not Modified)
// 如果前台设置缓存为0，仍然视情况缓存数据：http://localhost:3000/api/86/d5405a6d22
const handleCache = (cache, { time, ...data }, reply, req, status) => {
  // 最近更新时间
  let lastModified = req.headers['if-modified-since'];
  let prevEtag = req.headers['if-none-match'] || '';
  let unChange = lastModified === cache.date;

  let useCache = cache.cache > 0;

  reply
    .header('etag', prevEtag)
    .header('Connection', 'keep-alive')
    .header('X-Response-Time', time);

  if (useCache) {
    reply
      .header('last-modified', cache.date)
      .header(
        'Cache-Control',
        `must-revalidate,max-age=${cache.cache},s-maxage=${cache.cache}`
      )
      .header('expires', cache.expires);
  }
  // 返回304时不返回任何数据;
  if (unChange && useCache) {
    reply.status(304).send({});
    return;
  }

  let nextEtag = etag(JSON.stringify(data.data));
  unChange = prevEtag === nextEtag;
  reply.status(unChange ? 304 : status);

  if (unChange) {
    // console.log(unChange, prevEtag, unChange ? 304 : status);
    // 如果数据没有改变(ETag未变更),同时cache置为0(实时性要求较高),系统默认当前周期内数据未变更，前台缓存30秒
    if (!useCache) {
      reply
        .header('last-modified', cache.date)
        .header(
          'Cache-Control',
          `must-revalidate,max-age=${30},s-maxage=${30}`
        );
    }
    // 返回304时不返回任何数据;
    reply.send({});
    return;
  }

  reply.header('etag', nextEtag);
  // 如果有expires字段，表明数据在redis中读取出来
  reply.send(data);
};

const resSchema = {
  rows: { type: 'integer' },
  ip: { type: 'string' },
  key: { type: 'string' },
  title: { type: 'string' },
  time: { type: 'string' },
  source: { type: 'string' },
  header: { type: 'array', items: { type: 'string' } },
  dates: { type: 'array', items: { type: ['string', 'integer'] } },
  cache: {
    type: 'object',
    properties: {
      from: { type: 'string', enum: ['redis', 'database'] },
      date: { type: 'string' },
      expires: { type: 'string' },
      cache: { type: 'number' }
    }
  }
};

// 由于返回数据中data字段数据类型未知，使用schema会导致data内容丢失
// fastify 使用schema主要是解决 JSON.stringify速度不够快的问题
// 如果直接从redis中读取，读取的数据即为字符串，无需再转换
const responseSchema = {
  array: {
    type: 'object',
    properties: {
      ...resSchema,
      data: {
        type: 'array',
        items: { type: 'array', items: { type: ['string', 'number', 'null'] } }
      }
    }
  },
  update: {
    type: 'object',
    properties: {
      ...resSchema,
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: 'integer', affected_rows: 'string' }
        }
      }
    }
  }
};

let opts = {
  schema: {
    params: paramsJsonSchema,
    querystring: paramSchema
  }
};

module.exports = {
  opts,
  paramsJsonSchema,
  queryStringJsonSchema,
  handleStatus,
  responseSchema
};
