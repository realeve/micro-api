module.exports = function(fastify, _, next) {
  fastify.get('/mq/:topic/', async function(req, reply) {
    let { msg: messages } = req.query;
    let topic = req.params.topic;
    let { producer } = fastify.kafka; //['main']; // attributes: 1
    producer.send([{ topic, messages }], function(err, data) {
      // if (err) {
      //   console.error(err);
      //   reply.send(err);
      //   return;
      // }
      reply.send(data);
    });
    // reply.send({ success: true });
    // 数据库写测试  http://localhost:3000/api/87/7229122799?type=fastify
    // autocannon -c 100 -p 10 -t 10 http://localhost:3000/api/87/7229122799?type=fastify
  });
  next();
};
