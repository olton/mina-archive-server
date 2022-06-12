import {uptimeAddress, uptimeScore} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

const address1 = 'B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw'
const address2 = 'B62qr2twKMHyZygNZkULs5jxt4vWGKa1gcgoPdT93k8mT8SN6iiTscn'
const address3 = 'B62qihoRAks13CLTxnpUd2KXj9JYePhLtLTi8gdv83MBjCYKVfWz6CG'

log(`============== uptimeAddress ===============`)
logObject("uptimeAddress()")
logObject((await uptimeAddress(address1)).result)
logObject((await uptimeAddress(address2)).result)
logObject((await uptimeAddress(address3)).result)
