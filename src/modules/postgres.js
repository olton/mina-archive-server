const { Pool, Client } = require('pg')
const {log, debug} = require("./logging");
const {timestamp} = require("../helpers/timestamp");

const createPool = () => {
    const {host, user, database, password, port} = config.archive

    const pool = new Pool({
        user,
        host,
        database,
        password,
        port,
    })

    pool.on('error', (err, client) => {
        log(`Unexpected error on idle client ${err.message}`, true)
        process.exit(-1)
    })

    return pool
}

const createDBConnection = () => {
    globalThis.postgres = createPool()

    const pool = globalThis.postgres

    pool.query('select now()', (err, res) => {
        if (err) {
            throw err
        }
        log(`DB clients pool created at ${timestamp('-', res.rows[0].now)}`)
    })
}

const query = async (q, p) => {
    const client = await globalThis.postgres.connect()
    let result = null

    try {
        const start = Date.now()
        const res = await client.query(q, p)
        const duration = Date.now() - start
        if (config.debug) {
            debug('Executed query', { q, duration: duration + 'ms', rows: res.rowCount })
        }
        result = res
    } catch (e) {
        log(e.message, 'error', config.debug ? e : null)
    } finally {
        client.release()
    }

    return result
}

module.exports = {
    createDBConnection,
    query
}