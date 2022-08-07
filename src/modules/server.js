import {createDBConnection, listenNotifies, saveBlockchainHeight, saveEpoch, saveLastBlock, saveStat} from "./postgres.js"
import {log} from "../helpers/logging.js"
import {createConfig, readConfig} from "../helpers/arguments.js"
import fs from "fs"
import {setValue} from "../helpers/set-value.js"
import {hostname} from "os"
import {processPriceInfo} from "./price.js"
import {runWebServer} from "./webserver.js"
import {sendBroadcast} from "./websocket.js";
import {processTransactionPool} from "./graphql.js";
import path from "path";

const init = () => {
    const configFile = path.resolve(configPath, "config.json")
    const packageFile = path.resolve(rootPath, "package.json")
    const args = process.argv.slice(2)

    if (args.includes("--init")) createConfig(configFile)

    if (!fs.existsSync(configFile)) {
        log("Config file not exist! Use command 'node index --init' to create it!")
        process.exit(0)
    }

    globalThis.config = readConfig(configFile)
    globalThis.package = readConfig(packageFile)
    globalThis.ssl = config.server.ssl && (config.server.ssl.cert && config.server.ssl.key)
    globalThis.version = globalThis.package.version

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
        price: null,
        transactionPool: [],
        lastBlock: null
    }, {
        set(target, p, value, receiver) {
            target[p] = value
            return true
        }
    })

    log(`Welcome to Minataur v${version}!`)
}


export const run = () => {
    init()
    createDBConnection()
    saveLastBlock()
    saveBlockchainHeight()
    saveEpoch()
    saveStat()
    listenNotifies()
    runWebServer()
    // config.mode === 'dev' ? runWebServerDev() : runWebServer()
    processPriceInfo()
    processTransactionPool()
}
