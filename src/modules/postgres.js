import pg from 'pg'
import {log, debug} from "../helpers/logging.js"
import {timestamp} from "../helpers/timestamp"

const { Pool } = pg

const createPool = () => {
    const {host: archiveHost = 'localhost:5432', user, database, password} = config.archive
    const [host, port] = archiveHost.split(":")

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
        log(`DB clients pool created at ${timestamp(res.rows[0].now)}`)
    })
}

const listenNotifies = async () => {
    const client = await globalThis.postgres.connect()

    client.query('LISTEN new_block')
    client.on('notification', async (data) => {
        if (config.debug.pg_notify) {
            log(`New block notification:`, 'info', data.payload)
        }
        globalThis.broadcast.new_block = JSON.parse(data.payload)
    })
}

const query = async (q, p) => {
    const client = await globalThis.postgres.connect()
    let result = null

    try {
        const start = Date.now()
        const res = await client.query(q, p)
        const duration = Date.now() - start
        if (config.debug.pg_query) {
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

export {
    createDBConnection,
    query,
    listenNotifies
}