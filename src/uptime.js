import pg from 'pg'
import {log} from "./helpers/logging.js"
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import fetch from "node-fetch";
import {parse} from "node-html-parser";
import {datetime} from "@olton/datetime";
import {isset} from "./helpers/isset.js";
import {parseTime} from "./helpers/parsers.js";

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

const getUptimeData = async () => {
    const link = `https://uptime.minaprotocol.com/getPageData.php?pageNumber=%NUM%`

    let dataExists = true
    let page = 1
    let table = []

    try {
        while (dataExists) {
            // console.log("Link:", link.replace("%NUM%", page))
            const request = await fetch(link.replace("%NUM%", page))

            if (!request.ok) {
                return table
            }

            const html = parse(await request.text()).querySelector("tbody")

            if (!html.childNodes.length || (html.childNodes.length === 3 && html.innerText.includes('Under Maintenance'))) {
                dataExists = false
            } else {
                for (let tr of html.childNodes) {
                    if (tr.nodeType !== 1) continue
                    let a = []
                    for(let td of tr.childNodes) {
                        if (td.nodeType !== 1 || td.childNodes.length > 1) continue
                        a.push(td.childNodes.toString().replace(/\s%/g, ""))
                    }
                    table.push(a)
                }
            }
            page++
            //if (page >= 8) dataExists = false
        }

        console.log("Pages: ", page)

        return table
    } catch (e) {
        log(`No data or bad request for uptime!`, 'error', e.stack)
        return []
    }
}

const processCollectUptime = async () => {
    const data = await getUptimeData()
    const timestamp = datetime().format("MM/DD/YYYY HH:mm")
    let res, segment
    const client = await pool.connect()

    try {
        client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED")
        res = await client.query(`insert into uptime_segments ("timestamp") values (to_timestamp($1, 'MM/DD/YYYY HH24:MI')) returning id`, [timestamp])
        segment = res.rows[0].id

        for (let r of data) {
            const [position, address, score, rate] = r
            let key_id

            if (!address) continue

            res = await client.query(`select id from public_keys where value = $1`, [address])
            key_id = !res.rows.length || !isset(res.rows[0].id, true) ? false : res.rows[0].id

            if (!key_id) {
                res = await client.query(`insert into public_keys (value) values ($1) returning id`, [address])
                key_id = res.rows[0].id
            }

            await client.query(
                `insert into uptime (public_key_id, position, score, rate, segment_id)
             values ($1, $2, $3, $4, $5)`,
                [key_id, position, score, rate, segment]
            )
        }

        client.query("COMMIT")
    } catch (e) {
        client.query("ROLLBACK")
        log(`Can't load uptime data!`, `error`, e.stack)
    } finally {
        await client.release()
        setTimeout(processCollectUptime, parseTime("10m"))
    }
}

;(async () => {
    try {
        await processCollectUptime()
    } catch (e) {
        log(`Uptime leaderboard update failed!`, `error`, e.stack)
    }
})().catch( e => log(e.message, 'error', e.stack) )
