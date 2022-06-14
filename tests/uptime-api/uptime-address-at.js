import {UPTIME_DEFAULT, UPTIME_SIDECAR, UPTIME_SNARKWORK, uptimeAddressAt} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";
import {datetime} from "@olton/datetime";

const address1 = 'B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw'
const address2 = 'B62qr2twKMHyZygNZkULs5jxt4vWGKa1gcgoPdT93k8mT8SN6iiTscn'
const address3 = 'B62qihoRAks13CLTxnpUd2KXj9JYePhLtLTi8gdv83MBjCYKVfWz6CG'

const date = datetime().addDay(-60).format("YYYY-MM-DD HH:mm")

log(`============== uptimeAddress ===============`)
logObject("uptimeAddressAt()", date)
logObject((await uptimeAddressAt(address1, date, UPTIME_SIDECAR)).result)
// logObject((await uptimeAddressAt(address2, date, UPTIME_SIDECAR)).result)
// logObject((await uptimeAddressAt(address3, date, UPTIME_SIDECAR)).result)
