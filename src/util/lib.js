const R = require('ramda');
const dayjs = require('dayjs');
const redis = require('./redis');
// 转义防注入
let { escape } = require('sqlstring');

let client = redis.connect();

const getKey = (query) => {
  let { id, nonce, cache, ...props } = query;
  //   if (R.isNil(id) || R.isNil(nonce)) {
  //     return false;
  //   }
  props = props || [];
  let propKey = Object.entries(props)
    .map(([k, v]) => `${k}_${v}`)
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
  param = R.map(escape)(param);
  let arr = sql.trim().split('?');
  arr = R.filter((item) => item.length)(arr);

  return arr.map((item, i) => item + (param[i] || '')).join(' ');
};
module.exports.parseSql = parseSql;

const readDb = async (fastify, params) => {
  const connection = await fastify.mysql.getConnection();
  let setting = await getApiSetting(connection, params);
  if (R.isNil(setting)) {
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

  // {
  //     sqlstr: 'select id,db_name 数据库名,db_key 配置项键值 from sys_database',
  //     param: '',
  //     api_name: '数据库列表',
  //     db_key: 'db1',
  //     db_name: '接口管理'
  // }

  let { sqlstr, param: paramStr, db_name, api_name: title } = setting;

  let dates = [];
  let param = paramStr.trim().split(',');
  param = R.filter((item) => item.length > 0)(param);

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
  let [rows, fields] = await connection.query(sql);
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
  let { id, nonce, ...props } = params;

  // API列表
  let getCache = redis.getCache(client);
  let key = `api${id}_${nonce}`;
  let data = await getCache(key);
  if (data) {
    return JSON.parse(data);
  }

  // console.log('read api setting from redis')

  const [rows, fields] = await connection.query(
    "select a.sqlstr,rtrim(ifnull(a.param,'')) param,a.api_name,b.db_key,b.db_name FROM sys_api a INNER JOIN sys_database b on a.db_id = b.id where a.id=? and a.nonce=?",
    [id, nonce]
  );

  if (rows && !R.isNil(rows[0]) && !R.isNil(rows[0].err)) {
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

  let key = getKey(req.query);
  let data = key ? await getCache(key) : null;
  if (R.isNil(data)) {
    // console.log('read from redis')
    let setCache = redis.setCache(client);
    let result = await readDb(fastify, req.query);

    // 校验失败
    if (result.status) {
      // client.quit();
      return result;
    }

    let { cache, mode } = req.query;

    let redisRes = {
      ...result,
      key
    };

    if (cache > 0) {
      redisRes.cache = {
        date: now(),
        expires: future(cache),
        cache,
        from: 'redis'
      };
      setCache(key, redisRes, cache);
    }

    // handle Arr
    redisRes = handleData(redisRes, mode);

    data = Object.assign(redisRes, {
      cache: {
        from: 'database'
      },
      ip: req.ip,
      time: new Date().getTime() - timeStart + 'ms'
    });
  } else {
    // JSON.stringify,JSON.parse速度较慢，此处用拼接字符串处理
    // data = JSON.parse(data);
    return (
      data.slice(0, -1) +
      `,"ip":"${req.ip}","time":"${new Date().getTime() - timeStart}ms"}`
    );
  }

  //   data.ip = req.ip;
  //   data.time = new Date().getTime() - timeStart + 'ms';

  // 关闭连接
  // client.quit();
  return data;
};
