import path from "path";
import http from "http";
import express from "express";
import {shorten} from "../helpers/short-address.js";
import {log} from "../helpers/logging.js";
import {websocket} from "./websocket.js"
import {datetime, Datetime} from "@olton/datetime"
import favicon from "serve-favicon"
import {getUptimeNext} from "./queries.js";

const app = express()

const route = () => {
    app.use(express.static(path.join(appPath, 'public_html')))
    app.use(favicon(path.join(appPath, 'public_html', 'favicon.ico')))
    app.locals.pretty = true
    app.set('views', path.resolve(appPath, 'public_html'))
    app.set('view engine', 'pug')

    const clientConfig = JSON.stringify(config.client)

    app.get('/', async (req, res) => {
        res.render('index', {
            title: 'Minataur - The Fastest block explorer for Mina Blockchain',
            appBarTitle: 'MINA LIVE EXPLORER',
            version,
            clientConfig
        })
    })

    app.get('/uptime', async (req, res) => {
        const nextRound = await getUptimeNext()
        res.render('uptime', {
            title: 'Minataur - Uptime Leaderboard',
            appBarTitle: 'UPTIME LEADERBOARD',
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
            appBarTitle: 'ADDRESS INFO',
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
            appBarTitle: 'BLOCK INFO',
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
            appBarTitle: 'TRANSACTION INFO',
            hash,
            hashShort,
            clientConfig
        })
    })

    app.get('/transactions', async (req, res) => {
        res.render('transactions', {
            title: `Transactions in Mina Blockchain`,
            appBarTitle: 'TRANSACTIONS',
            clientConfig
        })
    })

    app.get('/addresses', async (req, res) => {
        res.render('addresses', {
            title: `Addresses in Mina Blockchain`,
            appBarTitle: 'ADDRESSES',
            clientConfig
        })
    })

    app.get('/blocks', async (req, res) => {
        res.render('blocks', {
            title: `Blocks in Mina Blockchain`,
            appBarTitle: 'BLOCKS',
            clientConfig
        })
    })

    app.get('/producers', async (req, res) => {
        res.render('producers', {
            title: `Block Producers in Mina Blockchain`,
            appBarTitle: 'BLOCK PRODUCERS',
            clientConfig
        })
    })

    app.get('/zero', async (req, res) => {
        res.render('zero', {
            title: `Zero Blocks in Mina Blockchain`,
            appBarTitle: 'ZERO BLOCKS',
            clientConfig
        })
    })

    app.get('/not-found', async (req, res) => {
        res.render('404', {
            title: `Information not found in Mina Blockchain by your request`,
            appBarTitle: 'NOT FOUND',
            clientConfig
        })
    })

    app.get('/search', async (req, res) => {
        const query = req.query
        const queryString = []

        for(let key in query) {
            queryString.push(query[key].trim())
        }

        res.render('search', {
            title: `Search Result in Mina Blockchain by your request`,
            appBarTitle: 'SEARCH RESULT',
            clientConfig,
            query: queryString.join(", ")
        })
    })
}

const runWebServer = () => {
    let httpWebserver
    const {host, port} = config.server

    httpWebserver = http.createServer({}, app)

    route()

    httpWebserver.listen(port, host, () => {
        log(`Minataur running on http://${host}:${port}`)
    })

    websocket(httpWebserver)
}

export {
    // runWebServerDev,
    runWebServer
}