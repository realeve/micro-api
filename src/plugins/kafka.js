'use strict';

const fp = require('fastify-plugin');
const kafka = require('kafka-node'),
  Producer = kafka.Producer;
// Consumer = kafka.Consumer;

function fastifyKafka(fastify, options, next) {
  // const { name } = options;
  // Reflect.deleteProperty(options, 'name');

  const client = new kafka.KafkaClient(options),
    producer = new Producer(client);

  // if (name) {
  //   if (!fastify.kafka) {
  //     fastify.decorate('kafka', {});
  //   }

  //   if (fastify.kafka[name]) {
  //     next(new Error('fastify.kafka.' + name + 'has already registered'));
  //     return;
  //   }

  //   fastify.kafka[name] = {
  //     client,
  //     producer
  //   };
  // } else {

  if (fastify.kafka) {
    next(new Error('fastify-kafka has already registered'));
    return;
  } else {
    fastify.kafka = {
      client,
      producer
    };
  }

  // }

  // producer.on('error', function(err) {
  //   next(new Error(err));
  // });

  // fastify.addHook('onClose', (fastify) => client.end());

  next();
}

module.exports = fp(fastifyKafka, {
  fastify: '>=1.0.0',
  name: 'fastify-kafka'
});
