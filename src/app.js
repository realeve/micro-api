'use strict';

const path = require('path');
const AutoLoad = require('fastify-autoload');
const { mysql: config } = require('./util/db');
const fastify = require('fastify')({
  ignoreTrailingSlash: true
  // logger: false
});

fastify.register(require('fastify-mysql'), {
  promise: true,
  connectionString: `mysql://${config.user}:${config.password}@${config.host}:${
    config.port
  }/${config.database}`
});

fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'services')
});

// schema 编译器
// https://github.com/fastify/docs-chinese/blob/master/docs/Validation-and-Serialization.md#schema-%E7%BC%96%E8%AF%91%E5%99%A8
// const Ajv = require('ajv');
// const ajv = new Ajv({
//   // fastify 使用的默认参数（如果需要）
//   removeAdditional: false, // 移除额外属性
//   useDefaults: true, // 当属性或项目缺失时，使用 schema 中预先定义好的 default 的值代替
//   coerceTypes: true, // 根据定义的 type 的值改变数据类型
//   allErrors: true // 检查出所有错误（译注：为 false 时出现首个错误后即返回）
//   // 任意其他参数
//   // ...
// });
// fastify.setSchemaCompiler(function(schema) {
//   return ajv.compile(schema);
// });

fastify.listen(3000, '0.0.0.0', (err, address) => {
  if (err) throw err;
  fastify.log.info(`server listening on ${address}`);
});
