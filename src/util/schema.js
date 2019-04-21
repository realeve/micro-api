// https://github.com/fastify/docs-chinese/blob/master/docs/Validation-and-Serialization.md
// 使用序列化参数提高性能
const queryStringJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
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
    id: { type: 'number' },
    nonce: { type: 'string', maxLength: 10, minLength: 10 },
    __cache: { type: ['string', 'number'] } //enum: ['array', 'json']
  },
  required: ['id', 'nonce', '__cache']
};
let opts = {
  schema: {
    params: paramsJsonSchema,
    querystring: paramSchema
  }
};

const handleErr = ({ status, msg, ...data }, reply) => {
  if (!status) {
    reply.send(data);
    // return data;
  }
  const err = new Error();
  err.statusCode = status;
  err.message = msg;
  throw err;
};

module.exports = {
  opts,
  paramsJsonSchema,
  queryStringJsonSchema,
  handleErr
};
