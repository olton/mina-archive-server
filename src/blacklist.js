import pg from 'pg'
import {log} from "./helpers/logging.js"
import {TextDecoder} from 'util'
import {decode} from "@faustbrian/node-base58"
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import fetch from "node-fetch";

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
    const scammersList = `https://raw.githubusercontent.com/nerdvibe/mina-addresses-blacklist/main/addresses.json`

    log(`Postgres client created successful.`)
    log(`Process started...`)

    try {
        const blacklistRequest = await fetch(scammersList)
        if (!blacklistRequest.ok) {
            client.release()
            log(`Process finished with error! Bad request to Repo!`)
            process.exit(-1)
        }

        const blacklist = await blacklistRequest.json()
        await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED")

        console.log(blacklist)

        for(let o of blacklist) {
            await client.query(`
                    insert into blacklist (public_key, reason)
                    values ($1, $2)
                    on conflict (public_key) do update
                        set reason = $2
                `, [o['address'], o['info']])
            log(`Address processed: ${o['address']}`)
        }

        await client.query("COMMIT")

        log("Blacklist loaded successfully!")
    } catch (e) {
        await client.query("ROLLBACK")
        log("Error, transaction was rolled back!")
        log(e.message)
        log(e.stack)
    } finally {
        await client.release()
        log(`Process finished! Enjoy...`)
    }
})().catch( e => log(e.message, 'error', e.stack) )
