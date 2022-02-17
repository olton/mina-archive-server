import pg from 'pg'
import {log} from "./helpers/logging.js"
import {TextDecoder} from 'util'
import {decode} from "@faustbrian/node-base58"
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import fetch from "node-fetch";
import {isset} from "./helpers/isset.js";

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
    const foundationList = `https://raw.githubusercontent.com/jrwashburn/mina-pool-payout/main/src/data/nps-addresses/Mina_Foundation_Addresses.csv`
    const o1labsList = `https://raw.githubusercontent.com/jrwashburn/mina-pool-payout/main/src/data/nps-addresses/O1_Labs_addresses.csv`

    log(`Postgres client created successful.`)
    log(`Process started...`)

    try {
        for (let listLink of [foundationList, o1labsList]) {
            const request = await fetch(listLink)
            if (!request.ok) {
                log(`List ${listLink} not accessible!`)
                continue
            }

            const list = await request.text()

            log(`Process stated for list ${listLink}`)

            await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED")

            for(let key of list.split("\n")) {
                key = key.trim()

                log(`Address processed: ${key}`)

                let res = await client.query(`select id from public_keys where value = $1`, [key])
                let key_id = !res.rows.length || !isset(res.rows[0].id, true) ? false : res.rows[0].id

                if (!key_id) {
                    res = await client.query(`insert into public_keys (value) values ($1) returning id`, [key])
                    key_id = res.rows[0].id
                }

                await client.query(`
                    insert into address (public_key_id, name, site)
                    values ($1, $2, $3)
                    on conflict (public_key_id) do update
                        set
                            name = $2,
                            site = $3
                `
                    , [
                        key_id,
                        listLink === foundationList ? 'Mina Foundation' : 'O(1) Labs',
                        "https://minaprotocol.com"
                    ]
                )

            }
            await client.query("COMMIT")
        }
        log("Foundation and O(1) Labs addresses loaded successfully!")
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
