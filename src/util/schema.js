const dayjs = require('dayjs');
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
const handleErr = ({ status = 200, error, msg, ...data }, reply, req) => {
  if (status > 299) {
    // const err = new Error();
    // err.statusCode = status;
    // err.message = msg;
    // throw err;
    reply.code(status).send({ statusCode: status, error, message: msg });
    return;
  }
  let { cache } = data;
  let prevEtag = req.headers['if-none-match'] || '';

  // http协议缓存处理,参考：https://hapijs.com/tutorials/caching?lang=en_US
  if (cache.cache) {
    handleCache(cache, data, reply, prevEtag, status);
    return;
  }
  reply.send(data);
};

// cache test:http://localhost:3000/api/85/579209ce04/0.2
const handleCache = (cache, data, reply, prevEtag, status) => {
  let nextEtag = etag(JSON.stringify(data.data));
  let isChange = prevEtag === nextEtag;

  reply
    .header('last-modified', cache.date)
    .header('etag', nextEtag)
    .header('Connection', 'keep-alive')
    .header(
      'cache-control',
      `must-revalidate,max-age=${cache.cache},s-maxage=${cache.cache}`
    )
    .status((status = isChange ? 304 : status));

  if (isChange) {
    // 返回304时不返回任何数据;
    reply.header('expires', cache.expires).send({});
    return;
  }

  // 如果有expires字段，表明数据在redis中读取出来
  if (cache.expires) {
    reply.header('expires', cache.expires).send(data);
  } else {
    reply.send(data);
  }
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
  handleErr,
  responseSchema
};
