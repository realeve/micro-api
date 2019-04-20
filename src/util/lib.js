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

const readDb = async(fastify) => {
    const connection = await fastify.mysql.getConnection();
    const [rows, fields] = await connection.query(
        'SELECT dept_name name,id value FROM sys_dept'
    );
    connection.release();
    return rows;
}

module.exports.handleReq = async(req, fastify) => {
    let client = redis.connect();
    let getCache = redis.getCache(client);
    let setCache = redis.setCache(client);

    let key = getKey(req.query);
    let data = key ? await getCache(key) : null;

    let {
        cache,
        format
    } = getDataFormat(req.query);

    if (R.isNil(data)) {
        let result = await readDb(fastify)
        let redisRes = {
            data: result,
            cache: {
                date: now(),
                expires: future(cache),
                cache,
                from: 'redis'
            },
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