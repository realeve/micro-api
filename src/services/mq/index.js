module.exports = function(fastify, _, next) {
  fastify.get('/mq/:topic/', async function(req, reply) {
    let { msg: messages } = req.query;
    let topic = req.params.topic;
    let { producer } = fastify.kafka['main'];
    producer.send([{ topic, messages, attributes: 1 }], function(err, data) {
      if (err) {
        console.error(err);
      }
      reply.send(data);
    });
  });
  next();
};
