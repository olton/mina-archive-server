import pg from 'pg'
import {log} from "./helpers/logging.js"
import {TextDecoder} from 'util'
import {decode} from "@faustbrian/node-base58"
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

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

;(async () => {
    const client = await pool.connect()

    log(`Postgres client created successful.`)
    log(`Process started...`)

    try {
        await client.query("BEGIN")
        const res = await client.query(`select id, memo from user_commands where memo like $1`, ["E4%"])
        for (let r of res.rows) {
            const decoded = (new TextDecoder().decode(decode(r.memo).slice(3, -4))).replace(/\0/g, "")
            await client.query(`update user_commands set memo = $1 where id = $2`, ["" + decoded, r.id])
            log(`Processed memo: ${r.memo} to ${decoded}`)
        }
        await client.query("COMMIT")
        log("Memo decoding complete!")
    } catch (e) {
        await client.query("ROLLBACK")
        log("Error, transaction was rolled back!")
        log(e.message)
        log(e.stack)
    }
})().catch( e => log(e.message, 'error', e.stack) )
