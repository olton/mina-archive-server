import {timestamp} from "./timestamp.js"

export const log = (msg, marker = 'info', ...data) => {
    console.log.apply(null, [`[${marker.toUpperCase()}] ${timestamp()} ${msg}`, ...data])
}

export const debug = (msg, data) => {
    log(msg, 'debug', data)
}

export const logObject = (obj, ...rest) => {
    console.log.apply(null, [JSON.stringify(obj, null, 2), ...rest])
}