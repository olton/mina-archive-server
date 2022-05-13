import fetch from "node-fetch"
import {log} from "../helpers/logging.js"
import {datetime} from "@olton/datetime"
import {parseTime} from "../helpers/parsers.js";
import {query} from "./postgres.js";

export const UPTIME_ENDPOINT_ADDRESS = `http://3.237.77.215:5001`
export const UPTIME_REQUEST_DEFAULT = `/uptimeScore/`
export const UPTIME_REQUEST_TYPE_SNARKWORK = `snarkwork`
export const UPTIME_REQUEST_TYPE_SIDECAR = `sidecar`

const fetchUptimeApi = async (query, timestamp) => {
    try {
        let url = UPTIME_ENDPOINT_ADDRESS+query

        if (timestamp) {
            url += (url.endsWith('/') ? '' : '/')+encodeURIComponent(datetime(timestamp).format("YYYY-MM-DDTHH:mm:ss")+"Z")
        }

        const result = await fetch(
            url,
            {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )

        return await (result.ok ? result.json() : result.text())
    } catch (e) {
        const msg = `The Request to Uptime API war aborted! ${e.message}`
        log(msg, 'error', e.stack)
        return msg
    }
}

const Result = (result) => typeof result === 'string' ? {ok: false, error: result} : {ok: true, result}

export const getUptimeBy = async (type = UPTIME_REQUEST_TYPE_SNARKWORK) => {
    return Result(await fetchUptimeApi(`${UPTIME_REQUEST_DEFAULT}${type}`))
}

export const getUptimeByAt = async (type = UPTIME_REQUEST_TYPE_SNARKWORK, timestamp) => {
    return Result(await fetchUptimeApi(`${UPTIME_REQUEST_DEFAULT}${type}`, timestamp))
}

const getAddressScore = (score, address) => {
    let position = 1
    for (let r of score) {
        if (r.block_producer_key === address) {
            return {
                position,
                ...r
            }
        }
        position++
    }
    return false
}

export const getAddressUptime = async (address, type = UPTIME_REQUEST_TYPE_SNARKWORK) => {
    const score = await getUptimeBy(type)
    if (!score.ok) {
        log(score.result, "error")
    }
    return score.ok ? getAddressScore(score.result, address) : null
}

export const getAddressUptimeAt = async (address, type = UPTIME_REQUEST_TYPE_SNARKWORK, timestamp) => {
    const score = await getUptimeByAt(type, timestamp)
    if (!score.ok) {
        log(score.result, "error")
    }
    return score.ok ? getAddressScore(score.result, address) : null
}

export const getUptimeAt = async (type = UPTIME_REQUEST_TYPE_SNARKWORK, timestamp) => {
    const score = await getUptimeByAt(type, timestamp)
    if (!score.ok) {
        log(score.result, "error")
    }
    return score.ok ? score.result : null
}

export const getUptime = async (type = UPTIME_REQUEST_TYPE_SNARKWORK) => {
    return await getUptimeAt(type)
}

const sidecar_update_interval = parseTime("10m")
const snark_update_interval = parseTime("20m")

export const processUpdateSidecarUptime = async () => {
    try {
        const timestamp = datetime()
        const result = await getUptime(UPTIME_REQUEST_TYPE_SIDECAR)
        let position = 1
        if (result) {
            const sql = `insert into uptime_sidecar(public_key, timestamp, position, score, score_percent) values ($1, $2, $3, $4, $5)`

            for(let r of result) {
                await query(sql, [r.block_producer_key, timestamp, position, r.score, r.score_percent])
                position++
            }
        }
        log(`Uptime snapshot by sidecar complete. ${position} addresses stored to DB.`)
    } catch (e) {
        log(e.message, "error", e.stack)
    } finally {
        setTimeout(processUpdateSidecarUptime, sidecar_update_interval)
    }
}

export const processUpdateSnarkUptime = async () => {
    try {
        const timestamp = datetime()
        const result = await getUptime(UPTIME_REQUEST_TYPE_SNARKWORK)
        let position = 1
        if (result) {
            const sql = `insert into uptime_snark(public_key, timestamp, position, score, score_percent) values ($1, $2, $3, $4, $5)`
            for(let r of result) {
                await query(sql, [r.block_producer_key, timestamp, position, r.score, r.score_percent])
                position++
            }
        }
        log(`Uptime snapshot by snark complete. ${position} addresses stored to DB.`)
    } catch (e) {
        log(e.message, "error", e.stack)
    } finally {
        setTimeout(processUpdateSnarkUptime, snark_update_interval)
    }
}

export const processUptime = async () => {
    setImmediate(processUpdateSidecarUptime)
    setImmediate(processUpdateSnarkUptime)
}