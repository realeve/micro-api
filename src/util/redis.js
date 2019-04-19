const { promisify } = require('util');
// redis-cli -p 6379 -a redis
// config set requirepass redis
// config get requirepass
const redis = require('redis').createClient({
  // password: 'redis',
  host: '127.0.0.1',
  port: 6379
});

const getCache = promisify(redis.get).bind(redis);
const setCache = (key, value, time = 0) => {
  redis.set(key, JSON.stringify(value), 'EX', time === 0 ? time : 60 * 60 * 24);
};

module.exports = { getCache, setCache };
