const { kafka: config } = require('../../config/kafka');
const kafka = require('kafka-node'),
  Consumer = kafka.Consumer,
  client = new kafka.KafkaClient(config);

var logger = require('kafka-node/lib/logging')('kafka-node:Consumer');

const consumer = new Consumer(
  client,
  [
    {
      topic: 'topiccc'
    },
    {
      topic: 'demo'
    }
  ],
  {
    autoCommit: false
  }
);

consumer.on('message', function(message) {
  console.log('开始消费:', new Date());
  let { topic, value, offset, partition, highWaterOffset: totalMsg } = message;
  console.log({ topic, value, offset, totalMsg });
  consumer.commit(true, function(err, data) {
    err && logger.debug('auto commit offset', err);
    consumer.setOffset(topic, partition, offset + 1);
    console.log(data);
    console.log(topic, partition, offset + 1);
  });
});

consumer.on('error', function(err) {
  console.error(err);
  throw new Error(err);
});
