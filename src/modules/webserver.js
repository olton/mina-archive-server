import https from "https";
import fs from "fs";
import path from "path";
import http from "http";
import express from "express";
import {
    getUptimeNext,
    getBlocksByHeight, getTransaction, getAddressByName, getAddressInfo, getBlockInfo
} from "./queries";
import {shorten} from "../helpers/short-address";
import {log} from "../helpers/logging.js";
import {websocket} from "./websocket.js"
import {datetime, Datetime} from "@olton/datetime"
import favicon from "serve-favicon"
import {checkPaymentStatus} from "./graphql.js";

const app = express()

const route = () => {
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

    app.get('/transactions', async (req, res) => {
        res.render('transactions', {
            title: `Transactions in Mina Blockchain`,
            clientConfig
        })
    })

    app.get('/addresses', async (req, res) => {
        res.render('addresses', {
            title: `Addresses in Mina Blockchain`,
            clientConfig
        })
    })

    app.get('/blocks', async (req, res) => {
        res.render('blocks', {
            title: `Blocks in Mina Blockchain`,
            clientConfig
        })
    })

    app.get('/producers', async (req, res) => {
        res.render('producers', {
            title: `Block Producers in Mina Blockchain`,
            clientConfig
        })
    })

    app.get('/zero', async (req, res) => {
        res.render('zero', {
            title: `Zero Blocks in Mina Blockchain`,
            clientConfig
        })
    })

    app.get('/not-found', async (req, res) => {
        res.render('404', {
            title: `Information not found in Mina Blockchain by your request`,
            clientConfig
        })
    })

    app.get('/search', async (req, res) => {
        const query = req.query
        const result = {
            addresses: [],
            blocks: [],
            transactions: [],
            payments: []
        }

        for(let key in query) {
            const val = query[key].trim()
            if (val.substring(0, 4) === 'B62q') {
                result.addresses.push(await getAddressInfo(val))
            } else if (val.substring(0, 3) === '3NK' || val.substring(0, 3) === '3NL') {
                result.blocks.push(await getBlockInfo(val))
            } else if (val.substring(0, 3) === 'Ckp') {
                result.transactions.push(await getTransaction(val))
            } else if (!isNaN(+val)) {
                (await getBlocksByHeight(+val)).map( b => {
                    result.blocks.push(b)
                })
            } else {
                (await getAddressByName(val)).map( b => {
                    result.addresses.push(b)
                })
                const checkPayment = await checkPaymentStatus(val)
                if (checkPayment) {
                    result.payments.push([val, checkPayment])
                }
            }
        }

        res.render('search-result', {
            title: `Search Result in Mina Blockchain by your request`,
            clientConfig,
            result
        })
    })
}

const runWebServerDev = () => {
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

    route()

    webserver.listen(+server_port, server_host, () => {
        log(`Minataur running on port ${server_port} in ${ssl ? 'secure' : 'non-secure'} mode`)
    })

    websocket(webserver)
}

const runWebServer = () => {
    let httpWebserver, httpsWebserver


    if (ssl) {
        const {cert, key} = config.server.ssl
        httpWebserver = http.createServer((req, res)=>{
            res.writeHead(301,{Location: `https://${req.headers.host}${req.url}`});
            res.end();
        })

        httpsWebserver = https.createServer({
            key: fs.readFileSync(key[0] === "." ? path.resolve(rootPath, key) : key),
            cert: fs.readFileSync(cert[0] === "." ? path.resolve(rootPath, cert) : cert)
        }, app)
    } else {
        httpWebserver = http.createServer({}, app)
    }

    route()

    httpWebserver.listen(80, () => {
        log(`Minataur running on http`)
    })

    if (ssl) {
        httpsWebserver.listen(443, () => {
            log(`Minataur running on https`)
        })
    }

    websocket(ssl ? httpsWebserver : httpWebserver)
}

export {
    runWebServerDev,
    runWebServer
}