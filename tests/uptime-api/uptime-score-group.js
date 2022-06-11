import {uptimeAddress, uptimeScore, uptimeScoreGroup} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

const address1 = 'B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw'
const address2 = 'B62qr2twKMHyZygNZkULs5jxt4vWGKa1gcgoPdT93k8mT8SN6iiTscn'
const address3 = 'B62qihoRAks13CLTxnpUd2KXj9JYePhLtLTi8gdv83MBjCYKVfWz6CG'
const group = [address1, address2, address3]

log(`============== uptimeAddress ===============`)
logObject("uptimeScoreGroup()")
logObject(await uptimeScoreGroup())

log(`============== uptimeAddress ===============`)
logObject("uptimeScoreGroup()")
logObject(await uptimeScoreGroup(group))
