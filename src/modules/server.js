const http = require('http')
const https = require('https')
const {createDBConnection, query} = require("./postgres");
const {log} = require("./logging");
const {createConfig, readConfig} = require("../helpers/arguments");
const fs = require("fs");
const {setValue} = require("../helpers/set-value");
const {hostname} = require("os");
const {version} = require("../../package.json");


const init = configPath => {
    const args = process.argv.slice(2)

    if (args.includes("--init")) createConfig(configPath)

    if (!fs.existsSync(configPath)) {
        log("Config file not exist! Use command 'node index --init' to create it!")
        process.exit(0)
    }

    globalThis.config = readConfig(configPath)

    const {archive, server} = config

    if (!archive) {
        log(`Archive connection parameters not defined in config`, 'error')
        process.exit(-1)
    }

    if (!server) {
        log(`Server launch options not defined in config`, 'error')
        process.exit(-2)
    }

    globalThis.host = setValue(server.name, hostname().split(".")[0])
}

const run = (configPath) => {
    log(`Mina Node Archivist v${version} is starting...`)

    init(configPath)
    createDBConnection()

    log(`Welcome to Mina Node Archivist v${version}!`)
}

module.exports = {
    init,
    run
}