import pg from 'pg'
import {log} from "./helpers/logging.js"
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {getArguments} from "./helpers/arguments.js";
import {isset} from "./helpers/isset.js";

const {Pool} = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json'), 'utf-8'))
const {host: archiveHost = 'localhost:5432', user, database, password} = config.archive
const [host, port] = archiveHost.split(":")

globalThis.args = getArguments()

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
    if (!isset(args.file)) {
        log(`You must define a addresses file with the parameter --file file_name`, 'error')
        process.exit(-1)
    }

    const file = args.file[0] === '.' ? path.resolve(__dirname, args.file) : args.file

    if (!fs.existsSync(file)) {
        log(`Ledger file with name ${file()} not exists!`, 'error')
        process.exit(-1)
    }

    const _file = fs.readFileSync(file, 'utf-8').split("\n")

    const client = await pool.connect()
    const scammersList = `https://raw.githubusercontent.com/nerdvibe/mina-addresses-blacklist/main/addresses.json`

    log(`Postgres client created successful.`)
    log(`Process started...`)


    try {
        await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED")
        await client.query("delete from delegation_program")

        for (let a of _file) {
            const address = a.trim()
            log(`Address processed ${address}`)
            let res = await client.query(`select id from public_keys where value = $1`, [address])
            let key_id = !res.rows.length || !isset(res.rows[0].id, true) ? false : res.rows[0].id
            if (!key_id) {
                res = await client.query(`insert into public_keys (value) values ($1) returning id`, [address])
                key_id = res.rows[0].id
            }

            let sql = `insert into delegation_program (id, public_key) values($1, $2)`
            await client.query(sql, [key_id, address])
        }

        await client.query("COMMIT")

        log("Delegations addresses loaded successfully!")
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
