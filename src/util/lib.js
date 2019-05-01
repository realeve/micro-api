const R = require('ramda');
const dayjs = require('dayjs');
const redis = require('./redis');
// 转义防注入
let { escape } = require('sqlstring');

let client = redis.connect();

const getKey = (query) => {
  let { id, nonce, cache, ...props } = query;
  // if (R.isNil(id) || R.isNil(nonce)) {
  //   return false;
  // }
  // if (!id || !nonce) {
  //   return false;
  // }
  props = props || [];
  let propKey = Object.entries(props)
    .map(([k, v]) => `${k.replace('__', '')}_${v}`)
    .join('_');
  propKey = propKey.length ? `_${propKey}` : '';
  let cacheStr = cache ? '_' + cache : '';
  return `${id}_${nonce}${cacheStr}${propKey}`;
};
module.exports.getKey = getKey;

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
const future = (seconds) =>
  dayjs()
    .add(seconds, 'second')
    .format('YYYY-MM-DD HH:mm:ss');
module.exports.now = now;
module.exports.future = future;

const formatItem = (item) => {
  if (/^\d+$/.test(item)) {
    return item;
  }
  // 防 SQL 注入
  return `'${item.replace(/'/g, "\\'").replace(/"/g, '\\"')}'`;
};

const parseSql = (sql, param = '') => {
  if (param.length === 0) {
    return sql;
  }
  // param = param.map(item => {
  //     if (R.type(item) === 'Array') {
  //         item = item.map(i => formatItem(i));
  //         return item.join(',');
  //     }
  //     return formatItem(item);
  // });
  param = param.map(escape); //(param);
  let arr = sql.trim().split('?');
  arr = arr.filter((item) => item.length); //(arr);

  return arr.map((item, i) => item + (param[i] || '')).join(' ');
};
module.exports.parseSql = parseSql;

const readDb = async (fastify, params) => {
  const connection = await fastify.mysql['db1'].getConnection();
  let setting = await getApiSetting(connection, params);
  if (!setting) {
    return {
      status: 404,
      msg: 'id or nonce is invalid.'
    };
  } else if (setting.err) {
    return {
      status: 500,
      msg: setting.err
    };
  }

  let { sqlstr, param: paramStr, db_name, api_name: title } = setting;

  let dates = [];
  let param = paramStr.trim().split(',');
  param = param.filter((item) => item.length > 0); //(param);

  if (param.includes('tstart') && param.includes('tend')) {
    dates = [params.tstart, params.tend];
  }

  // param 参数是否齐全
  let invalidParam = R.difference(param, Object.keys(params));

  if (invalidParam.length > 0) {
    return {
      status: 401,
      msg: `param '${invalidParam.join(',')}' required`
    };
  }

  // 处理sql
  let paramValues = R.values(R.pick(param, params));
  let sql = parseSql(sqlstr, paramValues);

  // console.log(sql)
  let [rows] = await connection.query(sql).catch(({ message, code }) => [
    {
      status: 500,
      msg: message,
      error: code
    }
  ]);
  // 报错
  if (rows.status) {
    return rows;
  }
  rows = handleCUD(sql, rows);

  let res = {
    rows: rows.length,
    dates,
    header: rows.length ? Object.keys(rows[0]) : [],
    title,
    source: '数据来源：' + db_name,
    data: rows
  };

  connection.release();
  return res;
};

// 处理写、改、删的返回数据
const handleCUD = (sql, rows) => {
  let mode = sql
    .trim()
    .toLowerCase()
    .slice(0, 7);

  if (mode === 'insert ') {
    let { insertId: id, affectedRows: affected_rows } = rows;
    rows = [
      {
        id,
        affected_rows
      }
    ];
  } else if (['udpate ', 'delete '].includes(mode)) {
    let { affected_rows } = rows;
    rows = [
      {
        affected_rows
      }
    ];
  }
  return rows;
};

const getApiSetting = async (connection, params) => {
  let { id, nonce } = params;

  // API列表
  let getCache = redis.getCache(client);
  let key = `api${id}_${nonce}`;
  let data = await getCache(key);
  if (data) {
    return JSON.parse(data);
  }

  // console.log('read api setting from redis')

  const [rows] = await connection.query(
    "select a.sqlstr,rtrim(ifnull(a.param,'')) param,a.api_name,b.db_key,b.db_name FROM sys_api a INNER JOIN sys_database b on a.db_id = b.id where a.id=? and a.nonce=?",
    [id, nonce]
  );

  // if (rows && !R.isNil(rows[0]) && !R.isNil(rows[0].err)) {
  if (rows && rows[0] && !rows[0].err) {
    let setCache = redis.setCache(client);
    setCache(key, rows[0], 30 * 24 * 60 * 60);
  }
  return rows[0];
};

// 转换数组
const handleData = (redisRes, mode) => {
  if (mode === 'json') {
    return redisRes;
  }
  redisRes.data = redisRes.data.map((item) => Object.values(item));
  return redisRes;
};

module.exports.handleReq = async (req, fastify) => {
  // let client = redis.connect();
  let timeStart = new Date().getTime();
  let getCache = redis.getCache(client);
  let { cache, mode } = req.query;

  let key = getKey(req.query);
  let data;
  if (cache > 0) {
    data = key ? await getCache(key) : null;
  }

  if (cache == 0 || !data) {
    // console.log('read from redis')
    let result = await readDb(fastify, req.query);

    // 校验失败
    if (result.status) {
      // client.quit();
      return result;
    }

    // let redisRes = {
    //   ...result,
    //   key
    // };

    let redisRes = result;
    let date = dayjs()
      .toDate()
      .toUTCString();

    // 对缓存不存在的同样做处理
    // if (cache > 0)
    {
      let setCache = redis.setCache(client);
      redisRes.cache = {
        date, // last-modified
        expires: dayjs()
          .add(cache, 'seconds')
          .toDate()
          .toUTCString(),
        cache,
        from: 'redis'
      };
      setCache(key, redisRes, cache);
    }

    // handle Arr
    redisRes = handleData(redisRes, mode);

    data = Object.assign(redisRes, {
      cache: {
        date,
        from: 'database',
        cache
      }
    });
  } else {
    data = JSON.parse(data);
  }

  data.ip = req.ip;
  data.time = new Date().getTime() - timeStart + 'ms';

  // 关闭连接
  // client.quit();
  return data;
};
