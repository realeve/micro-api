const R = require('ramda');
const dayjs = require('dayjs');
const redis = require('./redis');

const getKey = (query) => {
    let {
        id,
        nonce,
        cache,
        ...props
    } = query;
    if (R.isNil(id) || R.isNil(nonce)) {
        return false;
    }
    props = props || [];
    let propKey = Object.entries(props).map(([k, v]) => `${k}_${v}`).join('_');
    propKey = propKey.length ? `_${propKey}` : ''
    let format = cache ? '_cache' + cache : '';
    return `${id}_${nonce}${format}${propKey}`;
};
module.exports.getKey = getKey;

const getDataFormat = (query) => {
    let {
        cache
    } = query;
    if (['json', 'array'].includes(cache)) {
        return {
            format: cache,
            cache: 0
        };
    }
    return {
        format: 'json',
        cache: Number(cache * 60)
    };
};
module.exports.getDataFormat = getDataFormat;

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
const future = (seconds) =>
    dayjs()
    .add(seconds, 'second')
    .format('YYYY-MM-DD HH:mm:ss');
module.exports.now = now;
module.exports.future = future;

const parseSql = (sql, param = '') => {
    if (param.length === 0) {
        return sql;
    }
}

const readDb = async(fastify, client, params) => {
    const connection = await fastify.mysql.getConnection();
    let setting = await getApiSetting(connection, client, params);
    if (R.isNil(setting)) {
        return {
            status: 401,
            msg: 'id or nonce is invalid.'
        };
    }

    // {
    //     sqlstr: 'select id,db_name 数据库名,db_key 配置项键值 from sys_database',
    //     param: '',
    //     api_name: '数据库列表',
    //     db_key: 'db1',
    //     db_name: '接口管理'
    // }

    let {
        sqlstr,
        param: paramStr,
        db_name,
        api_name: title,
    } = setting;
    let sql = parseSql(sqlstr);

    let dates = [];
    let param = paramStr.split(',');
    if (param.includes('tstart') && param.includes('tend')) {
        dates = [params.tstart, params.tend];
    }

    const [rows, fields] = await connection.query(sql);

    let res = {
        rows: rows.length,
        dates,
        ip: '待加入',
        header: rows.length ? Object.keys(rows[0]) : [],
        title,
        time: '待加入',
        source: '数据来源：' + db_name,
        data: rows,
    }

    connection.release();
    return res;
}

const getApiSetting = async(connection, client, params) => {
    let {
        id,
        nonce,
        ...props
    } = params;

    // API列表
    let getCache = redis.getCache(client);
    let key = `api${id}_${nonce}`;
    let data = await getCache(key);
    if (data) {
        return JSON.parse(data);
    }

    // console.log('read api setting from redis')

    const [rows, fields] = await connection.query(
        'select a.sqlstr,rtrim(ifnull(a.param,\'\')) param,a.api_name,b.db_key,b.db_name FROM sys_api a INNER JOIN sys_database b on a.db_id = b.id where a.id=? and a.nonce=?', [id, nonce]
    );

    if (rows) {
        let setCache = redis.setCache(client);
        setCache(key, rows[0], 30 * 24 * 60 * 60);
    }
    return rows[0];
}

module.exports.handleReq = async(req, fastify) => {
    let client = redis.connect();
    let getCache = redis.getCache(client);

    let key = getKey(req.query);
    let data = key ? await getCache(key) : null;

    let {
        cache,
        format
    } = getDataFormat(req.query);

    if (R.isNil(data)) {

        // console.log('read from redis')

        let setCache = redis.setCache(client);
        let result = await readDb(fastify, client, req.query);

        // 校验失败
        if (result.status) {
            client.quit();
            return result;
        }

        let redisRes = {
            ...result,
            cache: {
                date: now(),
                expires: future(cache),
                cache,
                from: 'redis'
            },
            status: 200,
            key
        };
        setCache(key, redisRes, 60);
        data = Object.assign(redisRes, {
            cache: {
                from: 'database'
            }
        });
    }

    // 关闭连接
    client.quit();
    return data;
};