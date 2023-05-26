import {uptimeAddress, uptimeScore} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

const address1 = 'B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw'
const address2 = 'B62qnwB98XVAV7FzsC2ghQZZSz3PCUjciiK5qB2b8LmxMnuLMZ9hUGd'

log(`============== uptimeAddress ===============`)
logObject("uptimeAddress()")
logObject((await uptimeAddress(address1)).result)
logObject((await uptimeAddress(address2)).result)
