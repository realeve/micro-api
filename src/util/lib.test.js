const lib = require('./lib');

test('缓存键值', () => {
  expect(lib.getKey({ id: 2, nonce: 'a' })).toBe('2_a');
  expect(lib.getKey({ id: 2, nonce: 'a', cache: 3 })).toBe('2_a_cache3');
  expect(
    lib.getKey({ id: 2, nonce: 'a', tstart: '20190101', tend: '20190131' })
  ).toBe('2_a_tstart_20190101_tend_20190131');
  expect(
    lib.getKey({ id: 2, tstart: '20190101', tend: '20190131' })
  ).toBeFalsy();
  expect(
    lib.getKey({ nonce: 2, tstart: '20190101', tend: '20190131' })
  ).toBeFalsy();
});

test('获取数据格式', () => {
  expect(lib.getDataFormat({ cache: 'json' })).toMatchObject({
    format: 'json',
    cache: 0
  });
  expect(lib.getDataFormat({ cache: 2 })).toMatchObject({
    format: 'json',
    cache: 120
  });
  expect(lib.getDataFormat({ cache: 'array' })).toMatchObject({
    format: 'array',
    cache: 0
  });
});

test('时间', () => {
  expect(lib.now()).toHaveLength(19);

  expect(lib.future(60)).toHaveLength(19);
});