import {
    getAddressUptime, getAddressUptimeAt,
    getUptime, getUptimeByAt, processUpdateSidecarUptime,
    UPTIME_REQUEST_TYPE_SIDECAR, UPTIME_REQUEST_TYPE_SNARKWORK
} from "../src/modules/uptime-api.js";
import {log, logObject} from "../src/helpers/logging.js";

// log(`============== Default route, uptimeScore ===============`)
// logObject("Result")
// logObject(await getUptime())

// log(`============== SIDECAR route, uptimeScore ===============`)
// logObject("Result")
// logObject(await getUptimeByAt(UPTIME_REQUEST_TYPE_SIDECAR, "2022-03-01"))

// log(`============== SNARK route, uptimeScore ===============`)
// logObject("Result")
// logObject(await getUptimeScoreTypedAt(UPTIME_REQUEST_TYPE_SNARKWORK))

// log(`============== SNARK route, uptimeScore ===============`)
// logObject("Result")
// logObject(await getUptime(UPTIME_REQUEST_TYPE_SNARKWORK))

const address1 = 'B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw'
const address2 = 'B62qr2twKMHyZygNZkULs5jxt4vWGKa1gcgoPdT93k8mT8SN6iiTscn'
const address3 = 'B62qihoRAks13CLTxnpUd2KXj9JYePhLtLTi8gdv83MBjCYKVfWz6CG'

// log(`============== Score for address, uptimeScore ===============`)
// logObject("Result")
// logObject(await getAddressUptime(address1, UPTIME_REQUEST_TYPE_SNARKWORK))
//
// log(`============== Score for address, uptimeScore ===============`)
// logObject("Result")
// logObject(await getAddressUptime(address1, UPTIME_REQUEST_TYPE_SIDECAR))
//
// log(`============== Score for address, uptimeScore ===============`)
// logObject("Result")
// logObject(await getAddressUptimeAt(address1, UPTIME_REQUEST_TYPE_SNARKWORK, "2022-04-12"))
// logObject("Result")
// logObject(await getAddressUptimeAt(address1, UPTIME_REQUEST_TYPE_SIDECAR, "2022-04-12"))
