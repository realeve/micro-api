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
const handleErr = ({ status, msg, ...data }, reply) => {
  if (status > 299) {
    const err = new Error();
    err.statusCode = status;
    err.message = msg;
    throw err;
  }
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
  handleErr,
  responseSchema
};
