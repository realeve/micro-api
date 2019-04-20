const { promisify } = require('util');
// redis-cli -p 6379 -a redis
// config set requirepass redis
// config get requirepass
const connect = () =>
  require('redis').createClient({
    // password: 'redis',
    host: '127.0.0.1',
    port: 6379
  });

const getCache = (cient) => promisify(cient.get).bind(cient);
const setCache = (cient) => (key, value, time = 0) => {
  cient.set(key, JSON.stringify(value), 'EX', time ? time : 60 * 60 * 24);
};

module.exports = { getCache, setCache, connect };
