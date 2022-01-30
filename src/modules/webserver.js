import https from "https";
import fs from "fs";
import path from "path";
import http from "http";
import express from "express";
import {qBlocks, qGetEpoch, qGetStat, qDisputeBlocks, qAddressInfo, getUptimeNext} from "./queries";
import {shorten} from "../helpers/short-address";
import {timestamp} from "../helpers/timestamp";
import {formatNumber} from "../helpers/numbers";
import {log} from "../helpers/logging.js";
import {websocket} from "./websocket.js"
import {datetime, Datetime} from "@olton/datetime"
import favicon from "serve-favicon"

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

    app.use(express.static(path.join(rootPath, 'public_html')))
    app.use(favicon(path.join(rootPath, 'public_html', 'favicon.ico')))
    app.locals.pretty = true
    app.set('views', path.resolve(rootPath, 'public_html'))
    app.set('view engine', 'pug')

    const clientConfig = JSON.stringify(config.client)

    app.get('/', async (req, res) => {
        res.render('index', {
            title: 'Minataur - The Fastest block explorer for Mina Blockchain',
            version,
            clientConfig
        })
    })

    app.get('/uptime', async (req, res) => {
        const nextRound = await getUptimeNext()
        res.render('uptime', {
            title: 'Minataur - Uptime Leaderboard',
            version,
            clientConfig,
            nextRound: nextRound,
            nextRoundAt: datetime(nextRound).format("DD/MM/YYYY HH:mm")
        })
    })

    app.get('/address/:address', async (req, res) => {
        const address = req.params.address
        const addressShort = shorten(address, 10)

        res.render('address', {
            title: `Address Overview for ${address}`,
            address,
            addressShort,
            clientConfig
        })
    })

    app.get('/block/:hash', async (req, res) => {
        const hash = req.params.hash
        const hashShort = shorten(hash, 10)

        res.render('block', {
            title: `Block Overview for ${hash}`,
            hash,
            hashShort,
            clientConfig
        })
    })

    app.get('/transaction/:hash', async (req, res) => {
        const hash = req.params.hash
        const hashShort = shorten(hash, 10)

        res.render('transaction', {
            title: `Transaction Overview for ${hash}`,
            hash,
            hashShort,
            clientConfig
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