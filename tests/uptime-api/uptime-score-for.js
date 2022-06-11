import {UPTIME_SIDECAR, UPTIME_SNARKWORK, uptimeScoreFor} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

const address1 = 'B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw'
const address2 = 'B62qr2twKMHyZygNZkULs5jxt4vWGKa1gcgoPdT93k8mT8SN6iiTscn'
const address3 = 'B62qihoRAks13CLTxnpUd2KXj9JYePhLtLTi8gdv83MBjCYKVfWz6CG'

log(`============== uptimeScore ===============`)
logObject("uptimeScoreFor()")
logObject(await uptimeScoreFor(address1, UPTIME_SNARKWORK))
logObject(await uptimeScoreFor(address1, UPTIME_SIDECAR))
// logObject(await uptimeScoreFor(address2))
// logObject(await uptimeScoreFor(address3))
