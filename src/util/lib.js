const R = require('ramda');
const dayjs = require('dayjs');
const {
    getCache,
    setCache
} = require('./redis');

const getKey = (query) => {
    let {
        id,
        nonce,
        cache
    } = query;
    if (R.isNil(id)) {
        return false;
    }
    let format = cache ? '_cache' + cache : '';
    return `${id}_${nonce}${format}`;
};

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
        format: cache,
        cache: Number(cache * 60)
    };
};

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
const future = (seconds) =>
    dayjs()
    .add(seconds, 'second')
    .format('YYYY-MM-DD HH:mm:ss');

const readDb = async(fastify) => {
    const connection = await fastify.mysql.getConnection();
    const [rows, fields] = await connection.query(
        'SELECT dept_name name,id value FROM sys_dept'
    );
    connection.release();
    return rows;
}

module.exports.handleReq = async(req, fastify) => {
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
    return data;
};