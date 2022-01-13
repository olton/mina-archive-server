import https from "https";
import fs from "fs";
import path from "path";
import http from "http";
import express from "express";
import {qBlocks, qGetEpoch, qGetStat, qLatestBlocks} from "./queries";
import {shorten} from "../helpers/short-address";
import {timestamp} from "../helpers/timestamp";
import {formatNumber} from "../helpers/numbers";
import {log} from "../helpers/logging.js";
import {websocket} from "./websocket.js"
import {datetime, Datetime} from "@olton/datetime"

const app = express()

const runWebServer = () => {
    const [server_host, server_port] = config.server.host.split(":")
    let webserver

    if (ssl) {
        const {cert, key} = config.server.ssl
        webserver = https.createServer({
            key: fs.readFileSync(key[0] === "." ? path.resolve(rootPath, key) : key),
            cert: fs.readFileSync(cert[0] === "." ? path.resolve(rootPath, cert) : cert)
        }, app)
    } else {
        webserver = http.createServer({}, app)
    }

    app.use(express.static(path.join(rootPath, 'html')));
    app.locals.pretty = true
    app.set('views', path.resolve(rootPath, 'html'))
    app.set('view engine', 'pug')

    app.get('/', async (req, res) => {
        const {supercharge = []} = config.coinbase
        const lb = await qLatestBlocks()
        const cb = await qBlocks()
        const {global_slot, epoch, slot, height} = await qGetEpoch()
        const {total_producers, total_addresses, tr_applied, tr_failed, tr_total} = await qGetStat()
        const {last_updated, current_price = 0, price_change_24h = 0, price_change_percentage_24h = 0, total_supply = 0, currency = 'xxx', ath = 0, atl = 0} = cache.price


        for (let r of lb) {
            r.creator_key_short = shorten(r.creator_key, 8)
            r.winner_key_short = shorten(r.winner_key, 10)
            r.state_hash_short = shorten(r.state_hash, 7)
            r.coinbase = (r.coinbase / 10**9)
            r.snark_fee = (r.snark_fee / 10**9)
            r.fee_transfer = (r.fee_transfer / 10**9)
            r.trans_fee = (r.trans_fee / 10**9)
            r.age = Datetime.timeLapse(+r.timestamp)
            r.block_time = datetime(+r.timestamp).format("DD/MM/YYYY HH:mm")
            r.supercharge = supercharge.includes(r.coinbase)
        }

        for (let r of cb) {
            r.creator_key_short = shorten(r.creator_key, 8)
            r.winner_key_short = shorten(r.winner_key, 10)
            r.state_hash_short = shorten(r.state_hash, 7)
            r.coinbase = (r.coinbase / 10**9)
            r.snark_fee = (r.snark_fee / 10**9)
            r.fee_transfer = (r.fee_transfer / 10**9)
            r.trans_fee = (r.trans_fee / 10**9)
            r.age = Datetime.timeLapse(+r.timestamp)
            r.block_time = datetime(+r.timestamp).format("DD/MM/YYYY HH:mm")
            r.supercharge = supercharge.includes(r.coinbase)
        }

        res.render('index', {
            title: 'Minataur - The Fastest block explorer for Mina Blockchain',
            disputeBlocks: lb,
            canonicalBlocks: cb,
            totalProducers: formatNumber(+total_producers, 0, 3, " ", "."),
            totalAddresses: formatNumber(+total_addresses, 0, 3, " ", "."),
            totalTrans: formatNumber(+tr_total, 0, 3, " ", "."),
            appliedTrans: formatNumber(+tr_applied, 0, 3, " ", "."),
            failedTrans: formatNumber(+tr_failed, 0, 3, " ", "."),
            price: {
                value: current_price,
                currency: currency,
                last_updated: timestamp(last_updated, "/:"),
                total_supply: formatNumber(+(total_supply).toFixed(0),  0, 3, " ", ".")
            },
            epoch: formatNumber(+epoch, 0, 3, " ", "."),
            global_slot: formatNumber(+global_slot, 0, 3, " ", "."),
            slot: formatNumber(+slot, 0, 3, " ", "."),
            height: formatNumber(+height, 0, 3, " ", "."),
            version
        })
    })


    webserver.listen(+server_port, server_host, () => {
        log(`Minataur running on port ${server_port} in ${ssl ? 'secure' : 'non-secure'} mode`)
    })

    websocket(webserver)
}

export {
    runWebServer
}