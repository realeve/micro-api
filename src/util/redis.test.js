const redis = require('./redis');

test('redis 管理', async () => {
  let client = redis.connect();
  let getCache = redis.getCache(client);
  let setCache = redis.setCache(client);

  // 获取缓存
  let data = await getCache('_cache');
  expect(data).toBeNull();

  setCache('_test', { a: 'test' }, 10);
  data = await getCache('_test');
  expect(data).toBe(JSON.stringify({ a: 'test' }));

  setCache('_test', { a: 'test' });
  data = await getCache('_test');
  expect(data).toBe(JSON.stringify({ a: 'test' }));

  client.quit();
});
