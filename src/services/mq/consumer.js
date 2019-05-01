const { kafka: config } = require('../../config/kafka');
const kafka = require('kafka-node'),
  Consumer = kafka.Consumer,
  client = new kafka.KafkaClient(config),
  logger = require('kafka-node/lib/logging')('kafka-node:Consumer');

let payload = [{ topic: 'test' }, { topic: 'demo' }, { topic: 'topiccc' }];
let consumer;

// 使用自动获取payload，需要将集群所有节点启动
const admin = new kafka.Admin(client);
admin.listTopics((err, res) => {
  // console.log('topics', res);
  res = res.filter((item) => item.metadata).map(({ metadata }) => metadata);
  res = Object.keys(res[0]).filter((item) => item !== '__consumer_offsets');
  payload = res.map((topic) => ({ topic }));
  console.log(payload);
});

consumer = new Consumer(client, payload, {
  autoCommit: false
  // fetchMaxWaitMs: 30000
});

consumer.on('message', async function(message) {
  // console.log('开始消费:', new Date());
  let { topic, value, offset, partition, highWaterOffset: totalMsg } = message;
  // console.log(new Date(), offset);
  let res = await new Promise((resolve) => {
    setTimeout(() => {
      // console.log(`start ${offset}.${value}`);
      consumer.commit(true, function(err, data) {
        err && logger.debug('auto commit offset', err);
        resolve(`${offset}/${totalMsg - 1}.`);
      });
    }, 1000);
  });
  console.info(res);
  // setTimeout(() => {
  //   console.log(`start ${offset}.${value}`);
  //   consumer.commit(true, function(err, data) {
  //     err && logger.debug('auto commit offset', err);
  //     console.log(`${offset} is complete.`);
  //   });
  // }, 2000);
});

consumer.on('error', function(err) {
  console.error(err);
  throw new Error(err);
});
