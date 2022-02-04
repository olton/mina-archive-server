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
    const regexp = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?")

    log(`Postgres client created successful.`)
    log(`Process started...`)

    try {
        await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED")
        const res = await client.query(`
            select 
                   uc.id, 
                   uc.memo,
                   uc.source_id,
                   uc.amount,
                   uc.fee,
                   uc.type
            from user_commands uc 
            where uc.memo like $1
        `, ["E4%"])
        for (let r of res.rows) {
            const decoded = (new TextDecoder().decode(decode(r.memo).slice(3, -4))).toLowerCase()
            if (r.type.toLowerCase() !== 'payment') continue
            if (
                decoded.includes('airdrop') ||
                decoded.includes('announcing') ||
                decoded.includes('warning') ||
                decoded.includes('delegate') ||
                decoded.includes('important')
            ) {
                await client.query(`
                    insert into scam (user_command_id, reason) 
                    values ($1, $2) 
                    on conflict (user_command_id) do update
                        set reason = $2
                `, [r.id, decoded.replace(/\0/g, "")])
                log(`Potential scam found in memo: ${decoded}...Marked!`)
            }
        }
        await client.query("COMMIT")
        log("Memo decoding complete!")
    } catch (e) {
        await client.query("ROLLBACK")
        log("Error, transaction was rolled back!")
        log(e.message)
        log(e.stack)
    } finally {
        client.release()
    }
})().catch( e => log(e.message, 'error', e.stack) )
