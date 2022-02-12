import {createDBConnection, query, listenNotifies} from "./postgres"
import {log} from "../helpers/logging.js"
import {createConfig, readConfig} from "../helpers/arguments"
import fs from "fs"
import {setValue} from "../helpers/set-value"
import {hostname} from "os"
import pkg from "../../package.json"
import {processPriceInfo} from "./price"
import {runWebServer, runWebServerDev} from "./webserver"
import {sendBroadcast} from "./websocket.js";
import {processTransactionPool} from "./graphql.js";

const {version} = pkg

const init = configPath => {
    const args = process.argv.slice(2)

    if (args.includes("--init")) createConfig(configPath)

    if (!fs.existsSync(configPath)) {
        log("Config file not exist! Use command 'node index --init' to create it!")
        process.exit(0)
    }

    globalThis.config = readConfig(configPath)
    globalThis.ssl = config.server.ssl && (config.server.ssl.cert && config.server.ssl.key)
    globalThis.version = version

    const {archive, server, client} = config

    if (!archive) {
        log(`Archive connection parameters not defined in config`, 'error')
        process.exit(-1)
    }

    if (!server) {
        log(`Server launch options not defined in config`, 'error')
        process.exit(-2)
    }

    globalThis.host = setValue(server.name, hostname().split(".")[0])

    globalThis.broadcast = new Proxy({
    }, {
        set(target, p, value, receiver) {
            const data = {
                data: value,
                channel: p
            }

            sendBroadcast(data)

            target[p] = value
            return true
        }
    })

    globalThis.cache = new Proxy({
        price: null
    }, {
        set(target, p, value, receiver) {
            target[p] = value
            return true
        }
    })
}


export const run = (configPath) => {
    log(`Welcome to Minataur v${version}!`)

    init(configPath)
    createDBConnection()
    listenNotifies()
    config.mode === 'dev' ? runWebServerDev() : runWebServer()
    processPriceInfo()
    processTransactionPool()
}
