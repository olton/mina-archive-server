const {timestamp} = require("../helpers/timestamp");

const log = (msg, marker = 'info', ...data) => {
    console.log.apply(null, [`[${marker.toUpperCase()}] ${timestamp()} ${msg}`, ...data])
}

const debug = (msg, data) => {
    log(msg, 'debug', data)
}

module.exports = {
    log,
    debug
}