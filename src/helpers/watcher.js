import {watch, existsSync, readFileSync} from "fs"
import crypto from 'crypto'
import {hostname} from "os"
import {log} from "./logging.js";

export const configWatcher = (configFile) => {
    if (!configFile || !existsSync(configFile)) return

    log(`The observation for the config file enabled!`)
    let fsWait = false, md5Prev = null
    watch(configFile, (event, file) => {
        if (file) {
            if (fsWait) return
            fsWait = setTimeout(() => {
                fsWait = false
            }, 100)
            const newConfig = readFileSync(configFile, {encoding: 'utf-8'})
            const md5Curr = crypto.createHash('md5').update(newConfig).digest("hex")
            if (md5Curr === md5Prev) return
            md5Prev = md5Curr
            try {
                globalThis.config = JSON.parse(newConfig)
                globalThis.host = globalThis.config.name || hostname().split(".")[0]
                log(`The config file was changed. New values applied!`)
            } catch (e) {
                log(`New config is wrong! Please check it`, true)
            }
        }
    })
}
