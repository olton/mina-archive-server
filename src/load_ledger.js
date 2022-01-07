const {Pool} = require('pg')
const fs = require('fs')
const path = require("path")
const {log} = require("./modules/logging");
const {isset} = require("./helpers/isset");
const {getArguments} = require("./helpers/arguments");

globalThis.args = getArguments()

if (!isset(args.file)) {
    log(`You must define a ledger file name with the parameter -file file_name`)
    process.exit(-1)
}

globalThis.ledgerTable = `ledger_${isset(args['next'], false) && args['next'] ? "next" : "current"}`

const ledger = JSON.parse(fs.readFileSync(args.file[0] === '.' ? path.resolve(__dirname, args.file) : args.file, 'utf-8'))
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json'), 'utf-8'))
const {user, host, database, password, port} = config.archive

const pool = new Pool({
    user,
    host,
    database,
    password,
    port,
})

;(async () => {
    const client = await pool.connect()
    log(`Postgres client created successful.`)

    const saveTiming = async (data) => {
        let res, key_id, delegate_key_id, insertTimingData, sqlInsertTiming, sqlInsertLedger, insertLedgerData
        try {
            if (args['check-only']) {
                log(`Checked Key: ${data.pk}`)
                return
            }
            res = await client.query(`select id from public_keys where value = $1`, [data.pk])
            key_id = !res.rows.length || !isset(res.rows[0].id, true) ? false : res.rows[0].id
            if (!key_id) {
                res = await client.query(`insert into public_keys (value) values ($1) returning id`, [data.pk])
                key_id = res.rows[0].id
            }

            res = await client.query(`select id from public_keys where value = $1`, [data.delegate])
            delegate_key_id = !res.rows.length || !isset(res.rows[0].id, true) ? false : res.rows[0].id
            if (!delegate_key_id) {
                res = await client.query(`insert into public_keys (value) values ($1) returning id`, [data.pk])
                delegate_key_id = res.rows[0].id
            }

            sqlInsertLedger = `insert into ${ledgerTable} values ($1, $2, $3, $4, $5, $6)`
            insertLedgerData = [
                key_id,
                Math.round(data.balance * 10**9),
                delegate_key_id,
                isNaN(data.nonce) ? 0 : +data.nonce,
                data.receipt_chain_hash,
                data.voting_for
            ]

            await client.query(sqlInsertLedger, insertLedgerData)

            if (args.timing) {
                sqlInsertTiming = `insert into timing_info (public_key_id, token, initial_balance, initial_minimum_balance, cliff_time, cliff_amount, vesting_period, vesting_increment) values ($1, $2, $3, $4, $5, $6, $7, $8)`
                insertTimingData = [
                    key_id,
                    data.token,
                    Math.round((isset(data.timing.initial_balance, false) ? data.timing.initial_balance : data.timing.initial_minimum_balance) * 10 ** 9),
                    Math.round(data.timing.initial_minimum_balance * 10 ** 9),
                    data.timing.cliff_time,
                    Math.round(data.timing.cliff_amount * 10 ** 9),
                    data.timing.vesting_period,
                    Math.round(data.timing.vesting_increment * 10 ** 9)
                ]

                await client.query(sqlInsertTiming, insertTimingData)
            }
        } catch (e) {
            log(`Error import for key ${data.pk}`, 'error', e.stack)
        }
    }

    try {
        let processed = 0, skipped = 0
        log(`Process started...`)
        if (args.clear) {
            await client.query(`TRUNCATE table timing_info RESTART IDENTITY CASCADE`)
            await client.query(`TRUNCATE table ledger_current RESTART IDENTITY CASCADE`)
            await client.query(`TRUNCATE table ledger_next RESTART IDENTITY CASCADE`)
            await client.release()
            log(`Tables cleared.`)
            log(`Postgres client released successful.`)
            process.exit()
        }
        if (!isset(args['check-only'], false)) {
            await client.query(`BEGIN`)
            await client.query(`TRUNCATE table timing_info RESTART IDENTITY CASCADE`)
            await client.query(`TRUNCATE table ${ledgerTable} RESTART IDENTITY CASCADE`)
        }
        for (let o of ledger) {
            if (!isset(o.timing, false)) {
                skipped++
                continue
            }
            await saveTiming(o)
            processed++
        }
        if (!isset(args['check-only'], false)) {
            await client.query('COMMIT')
            log(`Import complete. Transaction was committed, ${processed} keys processed, ${skipped} skipped.`)
        } else {
            log(`Check complete. ${processed} keys processed, ${skipped} skipped.`)
        }
    } catch (e) {
        if (!isset(args['check-only'], false)) {
            await client.query('ROLLBACK')
            log(`Import not completed. The transaction was rolled back!`)
        } else {
            log(`Check not completed!`)
        }
    } finally {
        await client.release()
        log(`Postgres client released successful.`)
    }

})().catch( e => log('KU-'+e.message, 'error', e.stack) )
