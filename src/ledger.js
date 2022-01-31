import pg from 'pg'
import fs from 'fs'
import path from "path"
import {log} from "./helpers/logging.js"
import {isset} from "./helpers/isset"
import {getArguments} from "./helpers/arguments"
import {fileURLToPath} from "url";

const {Pool} = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

globalThis.args = getArguments()

if (args.help) {
    log(`Ledger loader v0.1.0. Copyright 2022 by Serhii Pimenov`)
    log(`Use key --file to specify ledger file name`)
    log(`Use key --epoch to specify epoch number`)
}

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
    let processed = 0
    const client = await pool.connect()
    log(`Postgres client created successful.`)
    log(`Process started...`)

    const saveTiming = async (data) => {
        let res, key_id, delegate_key_id, sqlInsertLedger, insertLedgerData
        try {
            log(`Processed key ${data.pk}`)
            res = await client.query(`select id from public_keys where value = $1`, [data.pk])
            key_id = !res.rows.length || !isset(res.rows[0].id, true) ? false : res.rows[0].id
            if (!key_id) {
                res = await client.query(`insert into public_keys (value) values ($1) returning id`, [data.pk])
                key_id = res.rows[0].id
            }

            if (data.pk !== data.delegate) {
                res = await client.query(`select id from public_keys where value = $1`, [data.delegate])
                delegate_key_id = !res.rows.length || !isset(res.rows[0].id, true) ? false : res.rows[0].id
                if (!delegate_key_id) {
                    res = await client.query(`insert into public_keys (value) values ($1) returning id`, [data.delegate])
                    delegate_key_id = res.rows[0].id
                }
            } else {
                delegate_key_id = key_id
            }

            const timing = isset(data.timing, false) ? data.timing : false

            sqlInsertLedger = `
                insert into ledger (
                    public_key_id,
                    balance, 
                    delegate_key_id,
                    nonce,
                    receipt_chain_hash,
                    voting_for,
                    token,
                    initial_balance,
                    initial_minimum_balance,
                    cliff_time,
                    cliff_amount,
                    vesting_period,
                    vesting_increment,
                    epoch
                ) 
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `

            insertLedgerData = [
                key_id,
                isNaN(+data.balance) ? 0 : Math.round(data.balance * 10**9),
                delegate_key_id,
                isNaN(+data.nonce) ? 0 : +data.nonce,
                data.receipt_chain_hash,
                data.voting_for,
                data.token,
                !timing ? null : Math.round((timing.initial_balance ? timing.initial_balance : timing.initial_minimum_balance) * 10**9),
                !timing ? null : Math.round(timing.initial_minimum_balance * 10**9),
                !timing ? null : timing.cliff_time,
                !timing ? null : Math.round(timing.cliff_amount * 10**9),
                !timing ? null : timing.vesting_period,
                !timing ? null : Math.round(timing.vesting_increment * 10**9),
                args.epoch
            ]

            await client.query(sqlInsertLedger, insertLedgerData)
        } catch (e) {
            log(`Process ${processed} Error import for key ${data.pk}`, 'error', e.stack)
            process.exit(-1)
        }
    }

    try {
        if (args.clear) {
            await client.query(`TRUNCATE table ledger RESTART IDENTITY CASCADE`)
            await client.release()
            log(`Ledger table was cleared.`)
            log(`Postgres client released successful.`)
            process.exit()
        }

        if (!isset(args.epoch)) {
            log(`You must define a epoch number with parameter --epoch epoch_num`)
            process.exit(-1)
        }

        if (args["clear-epoch"]) {
            await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
            await client.query(`delete from ledger where epoch = $1`, [args.epoch])
            await client.query('COMMIT')
            await client.release()
            log(`Data for epoch ${args.epoch} deleted from ledger.`)
            log(`Postgres client released successful.`)
            process.exit()
        }

        if (!isset(args.file)) {
            log(`You must define a ledger file name with the parameter --file file_name`)
            process.exit(-1)
        }

        const ledgerFile = args.file[0] === '.' ? path.resolve(__dirname, args.file) : args.file

        if (!fs.existsSync(ledgerFile)) {
            log(`Ledger file with name ${ledgerFile()} not exists!`)
            process.exit(-1)
        }

        const ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf-8'))

        await client.query('BEGIN')
        await client.query(`delete from ledger where epoch = $1`, [args.epoch])
        for (let o of ledger) {
            await saveTiming(o)
            processed++
        }
        // await saveTiming(ledger[0])
        await client.query('COMMIT')
        log(`Ledger data for epoch ${args.epoch} loaded successful! Processed ${processed} addresses.`)
    } catch (e) {
        await client.query('ROLLBACK')
        log(`Error`, 'error', e.stack)
    } finally {
        await client.release()
        log(`Postgres client released successful.`)
    }

})().catch( e => log(e.message, 'error', e.stack) )
