import pg from 'pg'
import {log} from "./helpers/logging.js"
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {datetime} from "@olton/datetime";
import {parseTime} from "./helpers/parsers.js";
import {query} from "./modules/postgres.js";
import {uptime, UPTIME_SIDECAR, UPTIME_SNARKWORK} from "./modules/uptime-api.js";

const {Pool} = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json'), 'utf-8'))
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
    // process.exit(-1)
})

const sidecar_update_interval = parseTime("10m")
const snark_update_interval = parseTime("20m")

const processUpdateSidecarUptime = async () => {
    const client = await pool.connect()
    const timestamp = datetime()

    try {
        const result = await uptime(UPTIME_SIDECAR)

        if (result.length) {
            client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED")
            const sql = `insert into uptime_sidecar(public_key, timestamp, position, score, score_percent) values ($1, $2, $3, $4, $5)`
            for(let r of result) {
                await client.query(sql, [r.block_producer_key, timestamp, r.position, r.score, r.score_percent])
            }
            client.query("COMMIT")
        }
        log(`Uptime snapshot by sidecar complete. ${result.length} addresses stored to DB.`)
    } catch (e) {
        log(e.message, "error", e.stack)
        client.query("ROLLBACK")
    } finally {
        setTimeout(processUpdateSidecarUptime, sidecar_update_interval)
    }
}

const processUpdateSnarkUptime = async () => {
    const client = await pool.connect()
    const timestamp = datetime()

    try {
        const result = await uptime(UPTIME_SNARKWORK)

        if (result.length) {
            client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED")
            const sql = `insert into uptime_snark(public_key, timestamp, position, score, score_percent) values ($1, $2, $3, $4, $5)`
            for(let r of result) {
                await client.query(sql, [r.block_producer_key, timestamp, r.position, r.score, r.score_percent])
            }
            client.query("COMMIT")
        }
        log(`Uptime snapshot by snark complete. ${result.length} addresses stored to DB.`)
    } catch (e) {
        log(e.message, "error", e.stack)
        client.query("ROLLBACK")
    } finally {
        setTimeout(processUpdateSnarkUptime, snark_update_interval)
    }
}

const processUptime = async () => {
    setImmediate(processUpdateSidecarUptime)
    setImmediate(processUpdateSnarkUptime)
}

;(async () => {
    try {
        await processUptime()
    } catch (e) {
        log(`Uptime leaderboard update failed!`, `error`, e.stack)
    }
})().catch( e => log(e.message, 'error', e.stack) )
