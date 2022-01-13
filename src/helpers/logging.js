import {timestamp} from "./timestamp.js"

export const log = (msg, marker = 'info', ...data) => {
    console.log.apply(null, [`[${marker.toUpperCase()}] ${timestamp()} ${msg}`, ...data])
}

export const debug = (msg, data) => {
    log(msg, 'debug', data)
}
