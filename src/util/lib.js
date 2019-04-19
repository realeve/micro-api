const R = require('ramda');
const dayjs = require('dayjs');

module.exports.getKey = (query) => {
  let { id, nonce, cache } = query;
  if (R.isNil(id)) {
    return false;
  }
  let format = cache ? '_cache' + cache : '';
  return `${id}_${nonce}${format}`;
};

module.exports.getDataFormat = (query) => {
  let { cache } = query;
  if (['json', 'array'].includes(cache)) {
    return { format: cache, cache: 0 };
  }
  return { format: cache, cache: Number(cache * 60) };
};

module.exports.now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
module.exports.future = (seconds) =>
  dayjs()
    .add(seconds, 'second')
    .format('YYYY-MM-DD HH:mm:ss');
